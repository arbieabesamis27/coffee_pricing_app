import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "../api";
import toast from "react-hot-toast";

interface DrinkPayload {
  name: string;
  description: string;
  variants: {
    id: string;
    name: string;
    sizeOz: number;
    profit: number;
    ingredients: {
      ingredientId: string;
      quantity: number;
    }[];
  }[];
}

interface AddEditDrinkProps {
  drink?: {
    id: string;
    name: string;
    description: string;
    variants: {
      id: string;
      name: string;
      sizeOz: number;
      profit: number;
      ingredients: {
        ingredientId: string;
        quantity: number;
      }[];
    }[];
  };
  onSaved: () => void;
  onCancel: () => void;
}

export default function AddEditDrink({
  drink,
  onSaved,
  onCancel,
}: AddEditDrinkProps) {
  const isEdit = !!drink;

  const [name, setName] = useState(drink?.name ?? "");
  const [description, setDescription] = useState(drink?.description ?? "");
  const [allIngredients, setAllIngredients] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>(
    drink?.variants ?? [
      { name: "Medium", sizeOz: 16, profit: 40, ingredients: [] },
      { name: "Large", sizeOz: 22, profit: 40, ingredients: [] },
    ]
  );

  useEffect(() => {
    api.get("/ingredients").then((r) => setAllIngredients(r.data));
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: DrinkPayload) => {
      if (isEdit) {
        await api.put(`/drinks/${drink!.id}`, payload);

        for (const v of variants) {
          if (v.id) {
            await api.put(`/variants/${v.id}`, {
              name: v.name,
              sizeOz: v.sizeOz,
              profit: v.profit,
              ingredients: v.ingredients.map((i: any) => ({
                ingredientId: i.ingredientId,
                quantity: i.quantity,
              })),
            });
          } else {
            await api.post(`/drinks/${drink!.id}/variants`, v);
          }
        }

        return { id: drink!.id }; // return something consistent
      } else {
        const d = (await api.post("/drinks", payload)).data;

        for (const v of variants) {
          await api.post(`/drinks/${d.id}/variants`, v);
        }

        return d;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Drink updated!" : "Drink added!");
      onSaved();
    },
    onError: () => {
      toast.error("Something went wrong. Try again.");
    },
  });

  function addIngredientRow(variantIndex: number) {
    const up = [...variants];
    up[variantIndex].ingredients = up[variantIndex].ingredients ?? [];
    up[variantIndex].ingredients.push({ ingredientId: "", quantity: 0 });
    setVariants(up);
  }

  function removeIngredientRow(variantIndex: number, ingIndex: number) {
    const up = [...variants];
    up[variantIndex].ingredients.splice(ingIndex, 1);
    setVariants(up);
  }

  function setIngredientField(
    variantIndex: number,
    ingIndex: number,
    field: "ingredientId" | "quantity",
    value: any
  ) {
    const up = [...variants];
    up[variantIndex].ingredients[ingIndex][field] =
      field === "quantity" ? Number(value) : value;
    setVariants(up);
  }

  function setVariantField(index: number, field: any, value: any) {
    const up = [...variants];
    up[index][field] = value;
    setVariants(up);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: DrinkPayload = {
      name,
      description,
      variants,
    };
    await mutation.mutateAsync(payload);
  }

  return (
    <div className="h-[80vh] overflow-y-auto p-2">
      <form onSubmit={handleSubmit} className="space-y-4 ">
        <input
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Drink name"
          required
        />
        <input
          className="border p-2 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />

        {variants.map((v: any, vi: number) => (
          <div key={vi} className=" border p-3 rounded bg-gray-50">
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 border p-2"
                value={v.name}
                onChange={(e) => setVariantField(vi, "name", e.target.value)}
              />
              <input
                className="w-15 sm:w-24 border p-2"
                value={v.sizeOz}
                onChange={(e) =>
                  setVariantField(vi, "sizeOz", Number(e.target.value))
                }
                type="number"
              />
              <input
                className="w-15 sm:w-24 border p-2"
                value={v.profit}
                onChange={(e) =>
                  setVariantField(vi, "profit", Number(e.target.value))
                }
                type="number"
              />
            </div>

            {(v.ingredients ?? []).map((ing: any, ii: number) => (
              <div key={ii} className="flex gap-2 items-center mb-2">
                <select
                  className="border p-2 flex-1 w-[100px] overflow-hidden  text-overflow-ellipsis"
                  value={ing.ingredientId}
                  onChange={(e) =>
                    setIngredientField(vi, ii, "ingredientId", e.target.value)
                  }
                >
                  <option value="">Select ingredient</option>
                  {allIngredients.map((ai) => (
                    <option key={ai.id} value={ai.id}>
                      {ai.name} ({ai.unit})
                    </option>
                  ))}
                </select>
                <input
                  className="border p-2 w-18 sm:w-24"
                  type="number"
                  value={ing.quantity}
                  onChange={(e) =>
                    setIngredientField(vi, ii, "quantity", e.target.value)
                  }
                />
                <button
                  type="button"
                  className=" py-1 text-red-500 rounded"
                  onClick={() => removeIngredientRow(vi, ii)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                    />
                  </svg>
                </button>
              </div>
            ))}

            <button
              type="button"
              className="px-2 py-1 bg-blue-600 text-white rounded"
              onClick={() => addIngredientRow(vi)}
            >
              + Add Ingredient
            </button>
          </div>
        ))}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 bg-amber-600 text-white rounded"
          >
            {drink ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
