import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p>{message}</p>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-3 py-1 rounded border">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1 rounded bg-red-600 text-white"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}
