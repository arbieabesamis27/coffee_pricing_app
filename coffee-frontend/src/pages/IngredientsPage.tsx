import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import AddEditIngredient from "../components/AddEditIngredient";

export default function IngredientsPage() {
  const { data: items = [], refetch } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => (await api.get("/ingredients")).data,
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/ingredients/${id}`);
      toast.success("Deleted");
      refetch();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Ingredients</h2>
        <button
          onClick={() => setAdding(true)}
          className="bg-amber-600 text-white px-3 py-1 rounded"
        >
          + Add Ingredient
        </button>
      </div>

      <div className="grid gap-4">
        {items.map((it: any) => (
          <div
            key={it.id}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{it.name}</div>
              <div className="text-sm text-gray-500">
                ₱{it.price} per {it.contentSize}
                {it.unit}
              </div>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setEditing(it)}
                className="bg-blue-500 text-white px-2 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(it)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add Ingredient"
      >
        <AddEditIngredient
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
        title={`Edit ${editing?.name}`}
      >
        {editing && (
          <AddEditIngredient
            ingredient={editing}
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
        title="Delete ingredient"
        message={`Delete ${deleteTarget?.name}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget.id)}
      />
    </div>
  );
}
