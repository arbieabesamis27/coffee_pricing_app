import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import AddEditDrink from "../components/AddEditDrink";

export default function DrinksPage() {
  const {
    data: drinks = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["drinks"],
    queryFn: async () => (await api.get("/drinks")).data,
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/drinks/${id}`);
      toast.success("Drink deleted");
      refetch();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Drinks</h2>
        <div>
          <button
            onClick={() => setAdding(true)}
            className="bg-amber-600 text-white px-3 py-1 rounded"
          >
            + Add Drink
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          drinks.map((d: any) => (
            <div
              key={d.id}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{d.name}</div>
                <div className="text-sm text-gray-500">{d.description}</div>
                <div className="mt-2">
                  {d.variants.map((v: any) => (
                    <span
                      key={v.id}
                      className="inline-block mr-2 bg-gray-100 px-2 py-1 rounded text-xs"
                    >
                      {" "}
                      {v.name} • ₱{v.finalPrice?.toFixed(2)}{" "}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setEditing(d)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(d)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add Drink">
        <AddEditDrink
          onSaved={() => {
            refetch();
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : ""}
      >
        {editing && (
          <AddEditDrink
            drink={editing}
            onSaved={() => {
              refetch();
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Drink"
        message={`Delete ${deleteTarget?.name}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </div>
  );
}
