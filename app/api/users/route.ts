// app/api/user-data/route.ts

import { adminDb, auth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

// Helper function to verify token and get user ID
async function verifyTokenAndGetUid(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("MISSING_AUTH_HEADER");
  }

  const idToken = authHeader.split("Bearer ")[1];

  if (!idToken) {
    throw new Error("INVALID_TOKEN_FORMAT");
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error: any) {
    throw new Error(
      `TOKEN_VERIFICATION_FAILED: ${error.code || error.message}`
    );
  }
}

// Helper function to get user data from Firestore
async function getUserFromFirestore(uid: string) {
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
    // Include Firestore document metadata
    metadata: {
      createTime: userDoc.createTime?.toDate().toISOString(),
      updateTime: userDoc.updateTime?.toDate().toISOString(),
      readTime: userDoc.readTime?.toDate().toISOString(),
    },
  };
}

// Helper function to get related user data from other collections
async function getRelatedUserData(uid: string) {
  try {
    const relatedData: any = {};

    // Example: Get user's subscription data
    const subscriptionsRef = adminDb.collection("subscriptions");
    const subscriptionQuery = await subscriptionsRef
      .where("userId", "==", uid)
      .get();

    if (!subscriptionQuery.empty) {
      relatedData.subscriptions = subscriptionQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createTime: doc.createTime?.toDate().toISOString(),
        updateTime: doc.updateTime?.toDate().toISOString(),
      }));
    }

    // Example: Get user's orders/purchases
    const ordersRef = adminDb.collection("orders");
    const ordersQuery = await ordersRef
      .where("userId", "==", uid)
      .limit(10)
      .get();

    if (!ordersQuery.empty) {
      relatedData.recentOrders = ordersQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createTime: doc.createTime?.toDate().toISOString(),
        updateTime: doc.updateTime?.toDate().toISOString(),
      }));
    }

    // Example: Get user's preferences
    const preferencesRef = adminDb.collection("userPreferences");
    const preferencesQuery = await preferencesRef
      .where("userId", "==", uid)
      .get();

    if (!preferencesQuery.empty) {
      relatedData.preferences = preferencesQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createTime: doc.createTime?.toDate().toISOString(),
        updateTime: doc.updateTime?.toDate().toISOString(),
      }));
    }

    // Example: Get user's activity logs (last 5)
    const activityRef = adminDb.collection("userActivity");
    const activityQuery = await activityRef
      .where("userId", "==", uid)
      .orderBy("timestamp", "desc")
      .limit(5)
      .get();

    if (!activityQuery.empty) {
      relatedData.recentActivity = activityQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createTime: doc.createTime?.toDate().toISOString(),
        updateTime: doc.updateTime?.toDate().toISOString(),
      }));
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
) {
  // Get user data from Firestore
  const firestoreUser = await getUserFromFirestore(uid);

  if (!firestoreUser) {
    throw new Error("USER_NOT_FOUND_IN_FIRESTORE");
  }

  // Get user auth record for additional metadata
  const userRecord = await auth.getUser(uid);

  // Get related data from other collections if requested
  const relatedData = includeRelated ? await getRelatedUserData(uid) : {};

  // Combine all data
  const combinedData = {
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
      userRecord.providerData?.map((provider) => ({
        uid: provider.uid,
        displayName: provider.displayName,
        email: provider.email,
        phoneNumber: provider.phoneNumber,
        photoURL: provider.photoURL,
        providerId: provider.providerId,
      })) || [],

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
function handleError(error: any) {
  console.error("API Error:", error);

  // Handle custom errors
  if (typeof error.message === "string") {
    if (error.message === "MISSING_AUTH_HEADER") {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    if (error.message === "INVALID_TOKEN_FORMAT") {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    if (error.message.startsWith("TOKEN_VERIFICATION_FAILED")) {
      return NextResponse.json(
        { error: "Token verification failed" },
        { status: 401 }
      );
    }

    if (error.message === "USER_NOT_FOUND_IN_FIRESTORE") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  // Handle specific Firebase Auth errors
  if (error.code) {
    switch (error.code) {
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
      default:
        break;
    }
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const uid = await verifyTokenAndGetUid(authHeader);

    // Check query parameters
    const { searchParams } = new URL(req.url);
    const includeRelated = searchParams.get("includeRelated") !== "false";
    const format = searchParams.get("format") || "full";

    const userData = await getCombinedUserData(uid, includeRelated);

    // Return different formats based on request
    let responseData;
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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const requestingUid = await verifyTokenAndGetUid(authHeader);

    // Parse request body
    let body: any = {};
    try {
      body = await req.json();
    } catch (parseError) {
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
    let responseData;
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
