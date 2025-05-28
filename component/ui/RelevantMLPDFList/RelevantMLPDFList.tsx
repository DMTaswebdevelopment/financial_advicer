import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { getDocumentsURL, setDocumentsURL } from "@/redux/storageSlice";
import { Document } from "@/component/model/interface/Document";
import { fetchDocumentURL } from "@/component/data/openDocument/OpenDocument";

interface Props {
  pdfLists: Document[];
}

const RelevantMLPDFList: React.FC<Props> = ({ pdfLists }) => {
  const dispatch = useDispatch();
  const documentUrl = useSelector(getDocumentsURL);

  const documentIDHandler = async (pdf: any) => {
    // const modifiedId = pdf.id.replace(/^(\S+)\s/, "$1-");

    // Check if this document ID already exists in Redux
    const existing = documentUrl.find((doc) => doc.id === pdf.id);

    if (existing) {
      console.log("Using cached URL from Redux:", existing.url);
      window.open(existing.url, "_blank");
      return;
    }

    try {
      const { url, error } = await fetchDocumentURL(pdf.id);

      if (url) {
        dispatch(setDocumentsURL([...documentUrl, { id: pdf.id, url }]));
        window.open(url, "_blank");
      } else {
        console.error("Failed to fetch document URL", error);
      }
    } catch (error) {
      console.log("Wrong ID", error);
    }
  };

  return (
    <>
      {pdfLists.map((pdf, docIndex) => (
        <motion.div
          key={pdf.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex w-full gap-5 items-center"
        >
          <span className="text-gray-500">{docIndex + 1}.</span>

          <button
            onClick={() => documentIDHandler(pdf)}
            rel="noopener noreferrer"
            className="flex items-center justify-between cursor-pointer bg-gray-50 p-3 rounded shadow w-full hover:bg-gray-100 transition-colors overflow-hidden"
          >
            <div className="flex items-center">
              <Image
                src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1745467628/images__1_-removebg-preview_wdcxcf.png"
                height={50}
                width={50}
                alt="pdf_logo"
              />
              <span className="ml-2 w-full text-start font-bold text-sm">
                {pdf.title}
              </span>
            </div>
          </button>
        </motion.div>
      ))}
    </>
  );
};

export default RelevantMLPDFList;
