import { useState } from "react";
import {
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImportIcon } from "lucide-react";
import FileUploadStep from "./fileupload-step";
import ColumnMappingStep from "./column-mapping-step";
import ConfirmationStep from "./confirmation-step";
const ImportTransactionModal = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [mappings, setMappings] = useState({});
  const [open, setOpen] = useState(false);
  const transactionFields = [
    { fieldName: "title", required: true },
    { fieldName: "amount", required: true },
    { fieldName: "type", required: true },
    { fieldName: "date", required: true },
    { fieldName: "category", required: true },
    { fieldName: "paymentMethod", required: true },
    { fieldName: "description", required: false }
  ];
  const handleFileUpload = (file2, columns, data) => {
    setFile(file2);
    setCsvColumns(columns);
    setCsvData(data);
    setMappings({});
    setStep(2);
  };
  const resetImport = () => {
    setFile(null);
    setCsvColumns([]);
    setMappings({});
    setStep(1);
  };
  const handleClose = () => {
    setOpen(false);
    setTimeout(() => resetImport(), 300);
  };
  const handleMappingComplete = (mappings2) => {
    setMappings(mappings2);
    setStep(3);
  };
  const handleBack = (step2) => {
    setStep(step2);
  };
  const renderStep = () => {
    switch (step) {
      case 1:
        return <FileUploadStep onFileUpload={handleFileUpload} />;
      case 2:
        return <ColumnMappingStep
          csvColumns={csvColumns}
          mappings={mappings}
          transactionFields={transactionFields}
          onComplete={handleMappingComplete}
          onBack={() => handleBack(1)}
        />;
      case 3:
        return <ConfirmationStep
          file={file}
          mappings={mappings}
          csvData={csvData}
          onBack={() => handleBack(2)}
          onComplete={() => handleClose()}
        />;
      default:
        return null;
    }
  };
  return <Dialog open={open} onOpenChange={handleClose}>
    <Button
    variant="outline"
    className="!shadow-none !cursor-pointer !border-gray-500
       !text-white !bg-transparent"
    onClick={() => setOpen(true)}
  >
      <ImportIcon className="!w-5 !h-5" />
      Bulk Import
    </Button>
  <DialogContent className="max-w-2xl min-h-[40vh]">
    {renderStep()}
  </DialogContent>
</Dialog>;
};
var stdin_default = ImportTransactionModal;
export {
  stdin_default as default
};
