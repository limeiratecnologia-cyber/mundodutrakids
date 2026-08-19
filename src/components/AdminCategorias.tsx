import React, { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Folder, Check, Sparkles, Filter } from "lucide-react";
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
  const [selectedSectionTab, setSelectedSectionTab] = useState<"all" | "menino" | "menina" | "ambos">("all");
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [section, setSection] = useState<"menino" | "menina" | "ambos">("menino");

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleOpenAdd = (defaultSection?: "menino" | "menina" | "ambos") => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setSection(defaultSection || (selectedSectionTab === "all" ? "menino" : selectedSectionTab));
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    const sec = cat.section || cat.gender || "ambos";
    setSection(sec === "unissex" ? "ambos" : sec);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      onEditCategory({
        ...editingCategory,
        name: name.trim().toUpperCase(),
        description: description.trim(),
        section,
        gender: section
      });
      triggerNotification("Categoria editada com sucesso!");
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: name.trim().toUpperCase(),
        description: description.trim(),
        section,
        gender: section
      };
      onAddCategory(newCat);
      triggerNotification("Nova categoria adicionada à sessão selecionada!");
    }
    setIsFormOpen(false);
  };

  const filteredCategories = useMemo(() => {
    if (selectedSectionTab === "all") return categories;
    return categories.filter(c => {
      const sec = c.section || c.gender || "ambos";
      return sec === selectedSectionTab || (selectedSectionTab === "ambos" && sec === "unissex");
    });
  }, [categories, selectedSectionTab]);

  const getSectionBadge = (catSection?: string) => {
    const sec = catSection || "ambos";
    if (sec === "menino") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
          👦 Menino
        </span>
      );
    }
    if (sec === "menina") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-50 text-pink-700 border border-pink-200">
          👧 Menina
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
        ✨ Ambas / Geral
      </span>
    );
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#5A5A40]" />
            <h3 className="font-extrabold text-gray-900 text-base">Gerenciamento de Categorias por Sessão</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Defina categorias exclusivas para a Sessão Menino, Menina ou categorias compartilhadas (Ambos).
          </p>
        </div>
        <button
          onClick={() => handleOpenAdd()}
          className="bg-[#5A5A40] hover:bg-[#484833] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {/* Filter Tabs by Section */}
      <div className="flex flex-wrap items-center gap-2 bg-[#f0f0ea] p-1.5 rounded-2xl w-fit border border-[#e0e0d6]">
        <button
          onClick={() => setSelectedSectionTab("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedSectionTab === "all"
              ? "bg-white text-gray-900 shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🧸 Todas ({categories.length})
        </button>
        <button
          onClick={() => setSelectedSectionTab("menino")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedSectionTab === "menino"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-gray-600 hover:text-blue-700"
          }`}
        >
          👦 Sessão Menino ({categories.filter(c => (c.section || c.gender) === "menino").length})
        </button>
        <button
          onClick={() => setSelectedSectionTab("menina")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedSectionTab === "menina"
              ? "bg-pink-600 text-white shadow-xs"
              : "text-gray-600 hover:text-pink-700"
          }`}
        >
          👧 Sessão Menina ({categories.filter(c => (c.section || c.gender) === "menina").length})
        </button>
        <button
          onClick={() => setSelectedSectionTab("ambos")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedSectionTab === "ambos"
              ? "bg-[#5A5A40] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ✨ Ambas / Geral ({categories.filter(c => {
            const s = c.section || c.gender;
            return !s || s === "ambos" || s === "unissex";
          }).length})
        </button>
      </div>

      {/* Form Modal / Drawer */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border-2 border-[#5A5A40]/30 shadow-md max-w-xl space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#5A5A40]" />
              {editingCategory ? "Editar Categoria" : "Nova Categoria de Produto"}
            </h4>
            <span className="text-[11px] font-bold text-gray-400">Campos com * são obrigatórios</span>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-2">
              Para qual Sessão esta categoria pertence? *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSection("menino")}
                className={`py-3 px-2 rounded-xl text-xs font-extrabold border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  section === "menino"
                    ? "bg-blue-50 border-blue-600 text-blue-900 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl">👦</span>
                <span>Sessão Menino</span>
              </button>
              <button
                type="button"
                onClick={() => setSection("menina")}
                className={`py-3 px-2 rounded-xl text-xs font-extrabold border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  section === "menina"
                    ? "bg-pink-50 border-pink-600 text-pink-900 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl">👧</span>
                <span>Sessão Menina</span>
              </button>
              <button
                type="button"
                onClick={() => setSection("ambos")}
                className={`py-3 px-2 rounded-xl text-xs font-extrabold border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  section === "ambos"
                    ? "bg-amber-50 border-amber-600 text-amber-900 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl">✨</span>
                <span>Ambos / Geral</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome da Categoria *</label>
            <input
              type="text"
              required
              placeholder="Ex: 👕 CONJUNTOS & BERMUDAS ou 👗 VESTIDOS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:bg-white transition font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Descrição Breve (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Roupas e peças selecionadas para ocasiões especiais"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#5A5A40] hover:bg-[#484833] text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Salvar Categoria
            </button>
          </div>
        </form>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const isConfirming = deleteConfirmId === cat.id;

          return (
            <div key={cat.id} className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-xs flex flex-col justify-between transition hover:shadow-md">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="p-2.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl">
                    <Folder className="w-5 h-5" />
                  </div>
                  {getSectionBadge(cat.section || cat.gender)}
                </div>
                
                <h4 className="font-extrabold text-gray-900 text-sm truncate">{cat.name}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                  {cat.description || "Nenhuma descrição informada."}
                </p>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 justify-end items-center min-h-[32px]">
                {isConfirming ? (
                  <div className="flex items-center gap-2 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-100 animate-pulse w-full justify-between">
                    <span className="text-[10px] font-bold text-red-600 uppercase">Excluir categoria?</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          onDeleteCategory(cat.id);
                          setDeleteConfirmId(null);
                          triggerNotification(`Categoria ${cat.name} removida.`);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="text-xs font-bold text-[#5A5A40] hover:bg-[#5A5A40]/10 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(cat.id)}
                      className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center space-y-3">
          <Folder className="w-10 h-10 text-gray-400 mx-auto" />
          <h4 className="font-extrabold text-gray-800 text-sm">Nenhuma categoria encontrada para este filtro</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Você pode adicionar uma nova categoria personalizada para esta sessão agora mesmo.
          </p>
          <button
            onClick={() => handleOpenAdd()}
            className="bg-[#5A5A40] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#484833] transition"
          >
            Adicionar Categoria
          </button>
        </div>
      )}
    </div>
  );
}
