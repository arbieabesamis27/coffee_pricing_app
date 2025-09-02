import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "../api";
import toast from "react-hot-toast";

interface IngredientPayload {
  name: string;
  price: number;
  contentSize: number;
  unit: string;
}

interface AddEditIngredientProps {
  ingredient?: {
    id: number;
    name: string;
    price: number;
    contentSize: number;
    unit: string;
  };
  onSaved: () => void;
  onCancel: () => void;
}

export default function AddEditIngredient({
  ingredient,
  onSaved,
  onCancel,
}: AddEditIngredientProps) {
  const isEdit = !!ingredient;

  const [name, setName] = useState(ingredient?.name ?? "");
  const [price, setPrice] = useState(ingredient?.price.toString() ?? "");
  const [contentSize, setContentSize] = useState(
    ingredient?.contentSize.toString() ?? ""
  );
  const [unit, setUnit] = useState(ingredient?.unit ?? "ml");

  const mutation = useMutation({
    mutationFn: async (payload: IngredientPayload) => {
      if (isEdit) {
        return (await api.put(`/ingredients/${ingredient!.id}`, payload)).data;
      }
      return (await api.post("/ingredients", payload)).data;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Ingredient updated!" : "Ingredient added!");
      onSaved();
    },
    onError: () => {
      toast.error("Something went wrong. Try again.");
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: IngredientPayload = {
      name,
      price: Number(price),
      contentSize: Number(contentSize),
      unit,
    };
    mutation.mutate(payload);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="border p-2 w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="border p-2"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          required
        />
        <input
          className="border p-2"
          type="number"
          step="0.01"
          value={contentSize}
          onChange={(e) => setContentSize(e.target.value)}
          placeholder="Content size"
          required
        />
      </div>
      <input
        className="border p-2 w-full"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        placeholder="Unit (ml)"
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 border rounded"
          disabled={mutation.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1 bg-amber-600 text-white rounded disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? "Saving..."
            : isEdit
            ? "Save Changes"
            : "Create"}
        </button>
      </div>
    </form>
  );
}
