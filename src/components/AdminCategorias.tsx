import React, { useState } from "react";
import { Plus, Edit, Trash2, Folder, Check } from "lucide-react";
import { Category } from "../types";

interface AdminCategoriasProps {
  categories: Category[];
  onAddCategory: (cat: Category) => void;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export default function AdminCategorias({ categories, onAddCategory, onEditCategory, onDeleteCategory }: AdminCategoriasProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      onEditCategory({
        ...editingCategory,
        name: name.trim().toUpperCase(),
        description: description.trim()
      });
      triggerNotification("Categoria editada com sucesso!");
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: name.trim().toUpperCase(),
        description: description.trim()
      };
      onAddCategory(newCat);
      triggerNotification("Nova categoria adicionada!");
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition-all ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#e0e0d6] shadow-sm">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">Gerenciamento de Categorias</h3>
          <p className="text-xs text-gray-500">Divisão estrutural de produtos (Padrão: ROUPAS, CALÇADOS, ACESSÓRIOS)</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#5A5A40] hover:bg-[#484833] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm max-w-md space-y-3.5 animate-fadeIn">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
            {editingCategory ? "Editar Categoria" : "Adicionar Categoria"}
          </h4>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nome da Categoria *</label>
            <input
              type="text"
              required
              placeholder="Ex: ✨ CALÇADOS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Tênis e calçados confortáveis"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#5A5A40] hover:bg-[#484833] text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              ✓ Salvar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const isConfirming = deleteConfirmId === cat.id;

          return (
            <div key={cat.id} className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex flex-col justify-between transition hover:shadow-md">
              <div className="flex gap-3 items-start">
                <div className="p-2.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{cat.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed break-words">{cat.description || "Nenhuma descrição adicionada."}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 justify-end items-center min-h-[32px]">
                {isConfirming ? (
                  <div className="flex items-center gap-2 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 animate-pulse w-full justify-between">
                    <span className="text-[10px] font-bold text-red-600 uppercase">Confirmar exclusão?</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          onDeleteCategory(cat.id);
                          setDeleteConfirmId(null);
                          triggerNotification(`Categoria ${cat.name} removida.`);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[10px] font-bold transition"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold transition"
                      >
                        Não
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="text-xs font-semibold text-[#5A5A40] hover:bg-[#5A5A40]/10 px-2 py-1 rounded transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(cat.id)}
                      className="text-xs font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
