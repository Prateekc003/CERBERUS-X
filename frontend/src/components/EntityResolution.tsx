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

  const entityTypes = ['ALL', 'PERSON', 'ORG', 'ORGANIZATION', 'LOCATION', 'DATE', 'PRODUCT', 'EVENT', 'QUANTITY', 'MONEY'];

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
        return <User className="w-3.5 h-3.5 text-blue-400" />;
      case 'ORG':
      case 'ORGANIZATION':
        return <Building className="w-3.5 h-3.5 text-indigo-400" />;
      case 'LOCATION':
        return <MapPin className="w-3.5 h-3.5 text-rose-400" />;
      case 'DATE':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      case 'PRODUCT':
        return <Package className="w-3.5 h-3.5 text-emerald-400" />;
      case 'QUANTITY':
      case 'MONEY':
        return <Hash className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const handleOpenMerge = (canonical: Entity) => {
    setSelectedCanonical(canonical);
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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#22222d] gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <Network className="w-5 h-5 text-indigo-400" />
              <span>Entity Resolution</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[10px] font-mono">
              spaCy NLP
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Named entities extracted across documents with alias matching and consolidation.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Entities: <strong className="text-white">{entities.length}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#14141b] border border-[#23232f] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entities..."
            className="w-full text-xs pl-8 pr-3 py-2 bg-[#0e0e14] border border-[#2a2a38] text-white rounded-lg focus:outline-none focus:border-slate-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-[#0e0e14] border border-[#2a2a38] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
          >
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Entities Table */}
      <div className="bg-[#14141b] border border-[#23232f] rounded-xl shadow-sm overflow-hidden">
        {filteredEntities.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No entities match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#22222d] text-slate-400 font-mono text-[11px] uppercase bg-[#101017]">
                  <th className="py-2.5 px-4 font-medium">Entity Name</th>
                  <th className="py-2.5 px-4 font-medium">Type</th>
                  <th className="py-2.5 px-4 font-medium">Normalized Form</th>
                  <th className="py-2.5 px-4 font-medium">Mentions</th>
                  <th className="py-2.5 px-4 font-medium">Aliases</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e28]">
                {filteredEntities.map((ent) => (
                  <tr key={ent.id} className="hover:bg-[#181822] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getEntityIcon(ent.entity_type)}
                        <span className="font-semibold text-white">{ent.name}</span>
                        {!ent.alias_of_id && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-900/60">
                            Canonical
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {ent.entity_type}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      {ent.normalized_name}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-[#0e0e14] border border-[#282836]">
                        {ent.mention_count || 1}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      {ent.aliases && ent.aliases.length > 0 ? (
                        <span className="text-slate-300">
                          {ent.aliases.join(', ')}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenMerge(ent)}
                        className="text-xs text-blue-400 hover:underline font-mono inline-flex items-center space-x-1"
                      >
                        <Merge className="w-3 h-3" />
                        <span>Merge Aliases</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Merge Modal */}
      {isMergeModalOpen && selectedCanonical && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#14141b] rounded-xl border border-[#2a2a38] shadow-2xl max-w-lg w-full p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#22222d]">
              <div className="flex items-center space-x-2">
                <Merge className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">
                  Consolidate Entity Aliases
                </h3>
              </div>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1 bg-[#0e0e14] p-3 rounded-lg border border-[#242432]">
              <p className="text-slate-400">Target Canonical Entity:</p>
              <p className="font-bold text-white font-mono">{selectedCanonical.name} ({selectedCanonical.entity_type})</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                Select matching mentions to merge into this canonical entity:
              </label>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#242432] rounded-lg p-2 bg-[#0e0e14]">
                {entities
                  .filter((e) => e.id !== selectedCanonical.id)
                  .map((e) => (
                    <label
                      key={e.id}
                      className="flex items-center space-x-2 p-1.5 hover:bg-[#181822] rounded cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAliases.includes(e.id)}
                        onChange={() => toggleAliasSelection(e.id)}
                        className="rounded border-[#2a2a38] bg-[#14141b] text-blue-500"
                      />
                      <span className="font-medium text-white">{e.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({e.entity_type})</span>
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#22222d]">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a38] text-slate-300 hover:bg-[#1f1f2a]"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteMerge}
                disabled={loading || selectedAliases.length === 0}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-white text-black hover:bg-slate-200 disabled:opacity-40"
              >
                {loading ? 'Merging...' : `Merge (${selectedAliases.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
