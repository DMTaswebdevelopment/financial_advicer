// app/api/user-data/route.ts

import { adminDb, auth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { UserRecord } from "firebase-admin/auth";
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";

// Type definitions
interface FirestoreUserData {
  docId: string;
  data: DocumentData;
  metadata: {
    createTime?: string;
    updateTime?: string;
    readTime?: string;
  };
}

interface SubscriptionData {
  id: string;
  userId: string;
  status: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

interface OrderData {
  id: string;
  userId: string;
  status: string;
  amount?: number;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

interface PreferenceData {
  id: string;
  userId: string;
  preferences: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

interface ActivityData {
  id: string;
  userId: string;
  action: string;
  timestamp: Timestamp;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

interface RelatedUserData {
  subscriptions?: SubscriptionData[];
  recentOrders?: OrderData[];
  preferences?: PreferenceData[];
  recentActivity?: ActivityData[];
}

interface AuthMetadata {
  creationTime?: string;
  lastSignInTime?: string;
  lastRefreshTime?: string | null;
}

interface ProviderData {
  uid: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  providerId: string;
}

interface FirestoreMetadata {
  docId: string;
  createTime?: string;
  updateTime?: string;
  readTime?: string;
}

interface CombinedUserData extends RelatedUserData {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  disabled: boolean;
  authMetadata: AuthMetadata;
  customClaims: Record<string, unknown>;
  providerData: ProviderData[];
  firestoreMetadata: FirestoreMetadata;
  fetchedAt: string;
  [key: string]: unknown; // For Firestore data that gets spread
}

interface BasicUserData {
  uid: string;
  email?: string;
  displayName?: string;
  emailVerified: boolean;
}

interface AuthUserData extends BasicUserData {
  photoURL?: string;
  phoneNumber?: string;
  authMetadata: AuthMetadata;
  customClaims: Record<string, unknown>;
  providerData: ProviderData[];
}

interface APIResponse<T> {
  success: true;
  data: T;
  meta: {
    format: string;
    includeRelated: boolean;
    fetchedAt: string;
  };
}

interface POSTAPIResponse<T> extends APIResponse<T> {
  meta: APIResponse<T>["meta"] & {
    targetUid: string;
    requestingUid: string;
  };
}

interface POSTRequestBody {
  targetUid?: string;
  includeRelated?: boolean;
  format?: "basic" | "auth" | "full";
}

type APIError = {
  error: string;
};

// Custom error types
class UserDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserDataError";
  }
}

// Helper function to convert Firestore timestamp to ISO string
function timestampToISOString(
  timestamp: Timestamp | undefined
): string | undefined {
  return timestamp?.toDate().toISOString();
}

// Helper function to process Firestore document
function processFirestoreDoc(doc: QueryDocumentSnapshot<DocumentData>) {
  return {
    id: doc.id,
    ...doc.data(),
    createTime: timestampToISOString(doc.createTime),
    updateTime: timestampToISOString(doc.updateTime),
  };
}

// Helper function to verify token and get user ID
async function verifyTokenAndGetUid(
  authHeader: string | null
): Promise<string> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UserDataError("MISSING_AUTH_HEADER");
  }

  const idToken = authHeader.split("Bearer ")[1];

  if (!idToken) {
    throw new UserDataError("INVALID_TOKEN_FORMAT");
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorCode = (error as { code?: string }).code;
    throw new UserDataError(
      `TOKEN_VERIFICATION_FAILED: ${errorCode || errorMessage}`
    );
  }
}

// Helper function to get user data from Firestore
async function getUserFromFirestore(
  uid: string
): Promise<FirestoreUserData | null> {
  const userRef = adminDb.collection("users");
  const userQuery = await userRef.where("id", "==", uid).get();

  if (userQuery.empty) {
    return null;
  }

  const userDoc = userQuery.docs[0];
  const userData = userDoc.data();

  return {
    docId: userDoc.id,
    data: userData,
    metadata: {
      createTime: timestampToISOString(userDoc.createTime),
      updateTime: timestampToISOString(userDoc.updateTime),
      readTime: timestampToISOString(userDoc.readTime),
    },
  };
}

// Helper function to get related user data from other collections
async function getRelatedUserData(uid: string): Promise<RelatedUserData> {
  try {
    const relatedData: RelatedUserData = {};

    // Get user's subscription data
    const subscriptionsRef = adminDb.collection("subscriptions");
    const subscriptionQuery = await subscriptionsRef
      .where("userId", "==", uid)
      .get();

    if (!subscriptionQuery.empty) {
      relatedData.subscriptions = subscriptionQuery.docs.map(
        (doc) => processFirestoreDoc(doc) as SubscriptionData
      );
    }

    // Get user's orders/purchases
    const ordersRef = adminDb.collection("orders");
    const ordersQuery = await ordersRef
      .where("userId", "==", uid)
      .limit(10)
      .get();

    if (!ordersQuery.empty) {
      relatedData.recentOrders = ordersQuery.docs.map(
        (doc) => processFirestoreDoc(doc) as OrderData
      );
    }

    // Get user's preferences
    const preferencesRef = adminDb.collection("userPreferences");
    const preferencesQuery = await preferencesRef
      .where("userId", "==", uid)
      .get();

    if (!preferencesQuery.empty) {
      relatedData.preferences = preferencesQuery.docs.map(
        (doc) => processFirestoreDoc(doc) as PreferenceData
      );
    }

    // Get user's activity logs (last 5)
    const activityRef = adminDb.collection("userActivity");
    const activityQuery = await activityRef
      .where("userId", "==", uid)
      .orderBy("timestamp", "desc")
      .limit(5)
      .get();

    if (!activityQuery.empty) {
      relatedData.recentActivity = activityQuery.docs.map(
        (doc) => processFirestoreDoc(doc) as ActivityData
      );
    }

    return relatedData;
  } catch (error) {
    console.warn("Error fetching related user data:", error);
    return {};
  }
}

// Helper function to combine user data
async function getCombinedUserData(
  uid: string,
  includeRelated: boolean = true
): Promise<CombinedUserData> {
  // Get user data from Firestore
  const firestoreUser = await getUserFromFirestore(uid);

  if (!firestoreUser) {
    throw new UserDataError("USER_NOT_FOUND_IN_FIRESTORE");
  }

  // Get user auth record for additional metadata
  const userRecord: UserRecord = await auth.getUser(uid);

  // Get related data from other collections if requested
  const relatedData = includeRelated ? await getRelatedUserData(uid) : {};

  // Combine all data
  const combinedData: CombinedUserData = {
    // Firebase Auth data
    uid: uid,
    email: userRecord.email,
    emailVerified: userRecord.emailVerified,
    displayName: userRecord.displayName,
    photoURL: userRecord.photoURL,
    phoneNumber: userRecord.phoneNumber,
    disabled: userRecord.disabled,

    // Auth metadata
    authMetadata: {
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      lastRefreshTime: userRecord.metadata.lastRefreshTime,
    },

    // Custom claims
    customClaims: userRecord.customClaims || {},

    // Provider data
    providerData:
      userRecord.providerData?.map(
        (provider): ProviderData => ({
          uid: provider.uid,
          displayName: provider.displayName,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          photoURL: provider.photoURL,
          providerId: provider.providerId,
        })
      ) || [],

    // Firestore user data (spread to allow override of auth data)
    ...firestoreUser.data,

    // Firestore metadata
    firestoreMetadata: {
      docId: firestoreUser.docId,
      createTime: firestoreUser.metadata.createTime,
      updateTime: firestoreUser.metadata.updateTime,
      readTime: firestoreUser.metadata.readTime,
    },

    // Related data from other collections
    ...relatedData,

    // Add timestamp for when this data was fetched
    fetchedAt: new Date().toISOString(),
  };

  return combinedData;
}

// Helper function to handle errors
function handleError(error: unknown): NextResponse<APIError> {
  console.error("API Error:", error);

  // Handle custom UserDataError
  if (error instanceof UserDataError) {
    switch (error.message) {
      case "MISSING_AUTH_HEADER":
        return NextResponse.json(
          { error: "Missing or invalid authorization header" },
          { status: 401 }
        );
      case "INVALID_TOKEN_FORMAT":
        return NextResponse.json(
          { error: "Invalid token format" },
          { status: 400 }
        );
      case "USER_NOT_FOUND_IN_FIRESTORE":
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      default:
        if (error.message.startsWith("TOKEN_VERIFICATION_FAILED")) {
          return NextResponse.json(
            { error: "Token verification failed" },
            { status: 401 }
          );
        }
    }
  }

  // Handle specific Firebase Auth errors
  const firebaseError = error as { code?: string };
  if (firebaseError.code) {
    switch (firebaseError.code) {
      case "auth/id-token-expired":
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      case "auth/id-token-revoked":
        return NextResponse.json({ error: "Token revoked" }, { status: 401 });
      case "auth/argument-error":
        return NextResponse.json(
          { error: "Invalid token format" },
          { status: 400 }
        );
      case "auth/user-not-found":
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(
  req: NextRequest
): Promise<
  NextResponse<
    APIResponse<BasicUserData | AuthUserData | CombinedUserData> | APIError
  >
> {
  try {
    const authHeader = req.headers.get("authorization");
    const uid = await verifyTokenAndGetUid(authHeader);

    // Check query parameters
    const { searchParams } = new URL(req.url);
    const includeRelated = searchParams.get("includeRelated") !== "false";
    const format = (searchParams.get("format") || "full") as
      | "basic"
      | "auth"
      | "full";

    const userData = await getCombinedUserData(uid, includeRelated);

    // Return different formats based on request
    let responseData: BasicUserData | AuthUserData | CombinedUserData;
    switch (format) {
      case "basic":
        responseData = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          emailVerified: userData.emailVerified,
        };
        break;
      case "auth":
        responseData = {
          uid: userData.uid,
          email: userData.email,
          emailVerified: userData.emailVerified,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          phoneNumber: userData.phoneNumber,
          authMetadata: userData.authMetadata,
          customClaims: userData.customClaims,
          providerData: userData.providerData,
        };
        break;
      default:
        responseData = userData;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        format: format,
        includeRelated: includeRelated,
        fetchedAt: userData.fetchedAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest
): Promise<
  NextResponse<
    POSTAPIResponse<BasicUserData | AuthUserData | CombinedUserData> | APIError
  >
> {
  try {
    const authHeader = req.headers.get("authorization");
    const requestingUid = await verifyTokenAndGetUid(authHeader);

    // Parse request body
    let body: POSTRequestBody = {};
    try {
      body = await req.json();
    } catch (parseError) {
      console.log("parseError", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { targetUid, includeRelated = true, format = "full" } = body;

    // Authorization check for accessing other users' data
    if (targetUid && targetUid !== requestingUid) {
      try {
        const requestingUserRecord = await auth.getUser(requestingUid);
        const isAdmin = requestingUserRecord.customClaims?.admin === true;

        if (!isAdmin) {
          return NextResponse.json(
            { error: "Unauthorized to access other user's data" },
            { status: 403 }
          );
        }
      } catch (authError) {
        console.log("authError", authError);
        return NextResponse.json(
          { error: "Failed to verify admin privileges" },
          { status: 500 }
        );
      }
    }

    // Use targetUid if provided (for admin access), otherwise use requesting user's UID
    const uidToFetch = targetUid || requestingUid;
    const userData = await getCombinedUserData(uidToFetch, includeRelated);

    // Return different formats based on request
    let responseData: BasicUserData | AuthUserData | CombinedUserData;
    switch (format) {
      case "basic":
        responseData = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          emailVerified: userData.emailVerified,
        };
        break;
      case "auth":
        responseData = {
          uid: userData.uid,
          email: userData.email,
          emailVerified: userData.emailVerified,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          phoneNumber: userData.phoneNumber,
          authMetadata: userData.authMetadata,
          customClaims: userData.customClaims,
          providerData: userData.providerData,
        };
        break;
      default:
        responseData = userData;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        targetUid: uidToFetch,
        requestingUid: requestingUid,
        format: format,
        includeRelated: includeRelated,
        fetchedAt: userData.fetchedAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
