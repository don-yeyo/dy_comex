import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Componente de autocompletado de productos.
 * Busca en código y nombre cuando el usuario escribe 3+ caracteres.
 * La búsqueda es case-insensitive y busca en cualquier parte del texto (LIKE '%term%').
 * Permite escritura libre de productos que no están en el catálogo.
 *
 * Props:
 *   value: string — texto actual del input
 *   onChange: (value: string) => void — callback al cambiar texto
 *   onSelect: (producto: { codigo, nombre, ... } | null) => void — callback al seleccionar una sugerencia
 *   productos: Array<{ id, codigo, nombre, marca, familia, subfamilia }> — catálogo precargado
 *   placeholder: string
 *   maxSuggestions: number (default: 8)
 */
export default function ProductAutocomplete({ value = '', onChange, onSelect, productos = [], placeholder = 'Escribí el nombre o código del producto...', maxSuggestions = 8 }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Filtrar productos en memoria (LIKE '%term%' en codigo + nombre)
  const suggestions = useCallback(() => {
    if (!value || value.length < 3) return [];
    const term = value.toLowerCase();
    return productos
      .filter(p => 
        (p.codigo && p.codigo.toLowerCase().includes(term)) ||
        (p.nombre && p.nombre.toLowerCase().includes(term))
      )
      .slice(0, maxSuggestions);
  }, [value, productos, maxSuggestions]);

  const filteredSuggestions = suggestions();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setShowDropdown(val.length >= 3 && filteredSuggestions.length > 0);
    setActiveIndex(-1);
  };

  // Actualizar dropdown cuando cambian sugerencias
  useEffect(() => {
    if (value.length >= 3 && filteredSuggestions.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [value, filteredSuggestions.length]);

  const handleSelect = (producto) => {
    const displayText = `${producto.codigo} — ${producto.nombre}`;
    onChange(displayText);
    if (onSelect) onSelect(producto);
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredSuggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        className="form-input"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (value.length >= 3 && filteredSuggestions.length > 0) setShowDropdown(true); }}
        placeholder={placeholder}
        maxLength={250}
        autoComplete="off"
      />
      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {filteredSuggestions.map((p, i) => (
            <div
              key={p.id || i}
              className={`autocomplete-item ${i === activeIndex ? 'active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="autocomplete-code">{p.codigo}</span>
              <span className="autocomplete-name">{p.nombre}</span>
              {p.familia && <span className="autocomplete-meta">{p.familia}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
