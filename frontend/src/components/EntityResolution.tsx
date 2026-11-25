import React, { useState } from 'react';
import { Network, Search, Merge, CheckCircle, User, Building, MapPin, Calendar, Tag, Package, Hash } from 'lucide-react';
import { Entity } from '../types';

interface EntityResolutionProps {
  entities: Entity[];
  onMergeEntities: (canonicalId: number, aliasIds: number[]) => Promise<void>;
  loading: boolean;
}

export const EntityResolution: React.FC<EntityResolutionProps> = ({
  entities,
  onMergeEntities,
  loading,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedCanonical, setSelectedCanonical] = useState<Entity | null>(null);
  const [selectedAliases, setSelectedAliases] = useState<number[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  const entityTypes = ['ALL', 'PERSON', 'ORG', 'LOCATION', 'DATE', 'PRODUCT', 'EVENT', 'QUANTITY'];

  const filteredEntities = entities.filter((ent) => {
    const matchSearch =
      ent.name.toLowerCase().includes(search.toLowerCase()) ||
      ent.normalized_name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || ent.entity_type === typeFilter;
    return matchSearch && matchType;
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'PERSON':
        return <User className="w-3.5 h-3.5 text-blue-600" />;
      case 'ORG':
        return <Building className="w-3.5 h-3.5 text-indigo-600" />;
      case 'LOCATION':
        return <MapPin className="w-3.5 h-3.5 text-red-600" />;
      case 'DATE':
        return <Calendar className="w-3.5 h-3.5 text-amber-600" />;
      case 'PRODUCT':
        return <Package className="w-3.5 h-3.5 text-emerald-600" />;
      case 'QUANTITY':
        return <Hash className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const handleOpenMerge = (canonical: Entity) => {
    setSelectedCanonical(canonical);
    // Find potential alias matches with same entity type
    const possibleAliases = entities
      .filter((e) => e.id !== canonical.id && e.entity_type === canonical.entity_type)
      .map((e) => e.id);
    setSelectedAliases([]);
    setIsMergeModalOpen(true);
  };

  const handleExecuteMerge = async () => {
    if (!selectedCanonical || selectedAliases.length === 0) return;
    await onMergeEntities(selectedCanonical.id, selectedAliases);
    setIsMergeModalOpen(false);
    setSelectedCanonical(null);
    setSelectedAliases([]);
  };

  const toggleAliasSelection = (id: number) => {
    setSelectedAliases((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900 tracking-tight">
            Entity Resolution & Disambiguation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Resolves cross-document entities, identifies duplicate mentions, and allows manual investigator consolidation.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Resolved Entities: <strong className="text-navy-900">{entities.length}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entity name or normalized alias..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Entity Type Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {entityTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded transition-colors ${
                typeFilter === t
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Entities Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {filteredEntities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            No entities found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-4 font-semibold">Entity Name</th>
                  <th className="py-2.5 px-4 font-semibold">Classification</th>
                  <th className="py-2.5 px-4 font-semibold">Normalized Representation</th>
                  <th className="py-2.5 px-4 font-semibold">Mentions</th>
                  <th className="py-2.5 px-4 font-semibold">Consolidated Aliases</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredEntities.map((ent) => (
                  <tr key={ent.id} className="hover:bg-slate-50 transition-colors">
                    {/* Entity Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getEntityIcon(ent.entity_type)}
                        <span className="font-semibold text-navy-900">{ent.name}</span>
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-4 font-mono">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        {ent.entity_type}
                      </span>
                    </td>

                    {/* Normalized Name */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {ent.normalized_name}
                    </td>

                    {/* Mentions */}
                    <td className="py-3 px-4 font-mono text-slate-800 font-bold">
                      {ent.mention_count}
                    </td>

                    {/* Aliases */}
                    <td className="py-3 px-4">
                      {ent.aliases && ent.aliases.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ent.aliases.map((a, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-mono">Canonical only</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenMerge(ent)}
                        className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        title="Merge alias variants into this canonical entity"
                      >
                        <Merge className="w-3.5 h-3.5" />
                        <span>Merge Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Merge Review Modal */}
      {isMergeModalOpen && selectedCanonical && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Merge className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-navy-900 text-sm">Entity Merge & Consolidation</h3>
              </div>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">
                Select other extracted entities to merge into canonical entity{' '}
                <strong className="text-blue-700 font-bold">"{selectedCanonical.name}"</strong> ({selectedCanonical.entity_type}).
              </p>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded p-2 text-xs">
                {entities
                  .filter((e) => e.id !== selectedCanonical.id && e.entity_type === selectedCanonical.entity_type)
                  .map((cand) => (
                    <label
                      key={cand.id}
                      className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 cursor-pointer rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedAliases.includes(cand.id)}
                          onChange={() => toggleAliasSelection(cand.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-800">{cand.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({cand.normalized_name})</span>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {cand.mention_count} mention(s)
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteMerge}
                disabled={selectedAliases.length === 0 || loading}
                className="text-xs font-semibold px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
              >
                Merge {selectedAliases.length} Entitie(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
