// src/components/admin/ContentLibrary.tsx
import React, { useState } from 'react';
import { 
  BookOpen, Search, Filter, Plus, Edit3, CheckCircle2, 
  Clock, Globe, Sparkles, Tag, Apple, Heart, ShieldAlert
} from 'lucide-react';
import { EducationalResource, ResourceReviewStatus } from '../../types/educationalResource';
import { EDUCATIONAL_RESOURCES } from '../../data/educationalResources';

export type ContentArticle = EducationalResource & {
  status?: ResourceReviewStatus;
};

const INITIAL_ARTICLES: ContentArticle[] = EDUCATIONAL_RESOURCES.map((res) => ({
  ...res,
  status: res.reviewStatus,
}));

export const ContentLibrary: React.FC = () => {
  const [articles, setArticles] = useState<ContentArticle[]>(INITIAL_ARTICLES);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedArticle, setSelectedArticle] = useState<ContentArticle | null>(null);

  const filtered = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.titleSwahili || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.keyNutrients || []).some(n => n.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          a.topics.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Published Articles</span>
            <BookOpen className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{articles.length}</p>
          <p className="text-xs text-teal-600 mt-1">100% Bilingual (English & Swahili)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Kenyan Superfoods</span>
            <Apple className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {articles.filter(a => a.category === 'NUTRITION_SUPERFOODS').length}
          </p>
          <p className="text-xs text-emerald-600 mt-1">Managu, Terere, Kunde, Wimbi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Clinical Sign-offs</span>
            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">100%</p>
          <p className="text-xs text-indigo-600 mt-1">Reviewed by licensed midwiferies</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Language Support</span>
            <Globe className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">ENG / SWA</p>
          <p className="text-xs text-amber-600 mt-1">Direct translation pairing</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search educational guides by title, Swahili term, or nutrient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="ALL">All Categories</option>
            <option value="NUTRITION_SUPERFOODS">Nutrition & Superfoods</option>
            <option value="DANGER_SIGNS">Danger Signs & Triage</option>
            <option value="POSTPARTUM_CARE">Postpartum Care</option>
            <option value="NEWBORN_DEVELOPMENT">Newborn Development</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(art => (
          <div
            key={art.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-teal-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 rounded-md font-semibold text-[11px]">
                  {art.category.replace('_', ' ')}
                </span>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {art.trimesterStage}
                </span>
              </div>

              <h4 className="font-bold text-gray-900 text-sm">{art.title}</h4>
              <p className="text-xs text-teal-700 italic mt-0.5 font-medium">{art.titleSwahili}</p>

              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{art.summary}</p>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {(art.keyNutrients || []).map((n, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-4 pt-3 border-t border-gray-100">
              <span>Reviewed: <strong>{art.reviewedBy}</strong></span>
              <button
                onClick={() => setSelectedArticle(art)}
                className="text-teal-700 hover:text-teal-800 font-semibold cursor-pointer"
              >
                Inspect Content
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 mb-1">{selectedArticle.title}</h3>
            {selectedArticle.titleSwahili && (
              <p className="text-xs text-teal-700 italic font-semibold mb-4">{selectedArticle.titleSwahili}</p>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="font-bold text-gray-700 block mb-1">English Clinical Summary:</span>
                <p className="text-gray-800 leading-relaxed">{selectedArticle.summary}</p>
              </div>

              {selectedArticle.summarySwahili && (
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                  <span className="font-bold text-teal-900 block mb-1">Muhtasari wa Kiswahili:</span>
                  <p className="text-teal-900 leading-relaxed">{selectedArticle.summarySwahili}</p>
                </div>
              )}

              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1.5">
                <span className="font-bold text-purple-900 block">Targeting & Personalization Metadata:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-purple-800">
                  <div><strong>Lifecycle:</strong> {selectedArticle.lifecycleStages.join(', ')}</div>
                  <div><strong>Priority Score:</strong> {selectedArticle.priority}</div>
                  <div><strong>Languages:</strong> {selectedArticle.languages.join(', ')}</div>
                  <div><strong>Review Status:</strong> {selectedArticle.reviewStatus}</div>
                </div>
                {selectedArticle.topics.length > 0 && (
                  <div className="text-[11px] text-purple-800 pt-1">
                    <strong>Topics:</strong> {selectedArticle.topics.join(', ')}
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <span>Clinical Reviewer: <strong>{selectedArticle.reviewedBy}</strong></span>
                <span className="text-gray-500">{selectedArticle.lastUpdated}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
