// src/components/admin/ContentLibrary.tsx
import React, { useState } from 'react';
import { 
  BookOpen, Search, Filter, Plus, Edit3, CheckCircle2, 
  Clock, Globe, Sparkles, Tag, Apple, Heart
} from 'lucide-react';

export interface ContentArticle {
  id: string;
  title: string;
  titleSwahili: string;
  category: 'NUTRITION_SUPERFOODS' | 'DANGER_SIGNS' | 'POSTPARTUM_CARE' | 'NEWBORN_DEVELOPMENT' | 'PARTNER_GUIDE';
  trimesterStage: 'Trimester 1' | 'Trimester 2' | 'Trimester 3' | 'Postnatal (0-6m)' | 'Child (6m-5yr)';
  summary: string;
  summarySwahili: string;
  keyNutrients: string[];
  reviewedBy: string;
  status: 'PUBLISHED' | 'DRAFT' | 'NEEDS_CLINICAL_REVIEW';
  lastUpdated: string;
}

const INITIAL_ARTICLES: ContentArticle[] = [
  {
    id: 'art_001',
    title: 'Managu (African Nightshade) for Maternal Iron & Blood Building',
    titleSwahili: 'Managu kwa Kuongeza Damu na Madini ya Chuma Wakati wa Ujauzito',
    category: 'NUTRITION_SUPERFOODS',
    trimesterStage: 'Trimester 1',
    summary: 'Managu provides rich bioavailable iron and folic acid crucial for early neural tube development and preventing maternal anemia.',
    summarySwahili: 'Managu yana madini ya chuma na asidi ya folic yanayosaidia kuzuia upungufu wa damu na kuimarisha ukuaji wa mtoto.',
    keyNutrients: ['Iron (Fe)', 'Folate (B9)', 'Vitamin C', 'Calcium'],
    reviewedBy: 'Dr. Wanjiru Mwangi (KMPDC/A49281)',
    status: 'PUBLISHED',
    lastUpdated: '2026-08-20'
  },
  {
    id: 'art_002',
    title: 'Terere (Amaranth Leaves) & Bone Strength in Second Trimester',
    titleSwahili: 'Terere na Kuimarisha Mifupa Katika Miezi Mitatu ya Pili',
    category: 'NUTRITION_SUPERFOODS',
    trimesterStage: 'Trimester 2',
    summary: 'High calcium and protein content in Terere supports rapid fetal skeletal calcification and maternal bone density.',
    summarySwahili: 'Terere ina kalsiamu nyingi na protini inayosaidia kujenga mifupa imara ya mtoto tumboni.',
    keyNutrients: ['Calcium', 'Plant Protein', 'Vitamin A', 'Potassium'],
    reviewedBy: 'Faith Chebet Otieno (NCK/RN-88219)',
    status: 'PUBLISHED',
    lastUpdated: '2026-08-22'
  },
  {
    id: 'art_003',
    title: 'Kunde (Cowpea Leaves) & Postpartum Lactation Support',
    titleSwahili: 'Kunde na Kuongeza Maziwa ya Mama Baada ya Kujifungua',
    category: 'NUTRITION_SUPERFOODS',
    trimesterStage: 'Postnatal (0-6m)',
    summary: 'Kunde leaves stimulate optimal breast milk production and replenish maternal micronutrient stores post-delivery.',
    summarySwahili: 'Kunde husaidia kuchochea uzalishaji wa maziwa ya kutosha na kurejesha nguvu za mama.',
    keyNutrients: ['Zinc', 'Magnesium', 'Dietary Fiber', 'Iron'],
    reviewedBy: 'Mercy Nyaboke, CO (COC/REG-40192)',
    status: 'PUBLISHED',
    lastUpdated: '2026-08-25'
  },
  {
    id: 'art_004',
    title: 'Wimbi (Finger Millet) Porridge for Complementary Weaning',
    titleSwahili: 'Uji wa Wimbi kwa Ajili ya Kuanza Kumlisha Mtoto (Miezi 6+)',
    category: 'NEWBORN_DEVELOPMENT',
    trimesterStage: 'Child (6m-5yr)',
    summary: 'Fermented finger millet flour enriched with groundnut/milk provides ideal energy density for rapid infant growth.',
    summarySwahili: 'Uji wa wimbi uliotiwa maziwa au njugu unampa mtoto nguvu za kutosha kukua kwa afya.',
    keyNutrients: ['Complex Carbs', 'Calcium', 'Phosphorus', 'Iron'],
    reviewedBy: 'Dr. Brian Ochieng (KMPDC/B31980)',
    status: 'PUBLISHED',
    lastUpdated: '2026-08-28'
  },
  {
    id: 'art_005',
    title: 'Recognizing Danger Signs: Severe Headache & Blurred Vision',
    titleSwahili: 'Kutambua Dalili za Hatari: Maumivu Makali ya Kichwa na Macho Kuona Giza',
    category: 'DANGER_SIGNS',
    trimesterStage: 'Trimester 3',
    summary: 'Sudden onset of severe frontal headache accompanied by visual disturbances indicates urgent pre-eclampsia triage.',
    summarySwahili: 'Maumivu makali ya kichwa pamoja na kutoona vizuri ni dalili ya shinikizo la juu la damu inayohitaji hospitali mara moja.',
    keyNutrients: ['Clinical Emergency Protocol', 'BP Monitoring', 'MOH 216 Card P.4'],
    reviewedBy: 'Dr. Wanjiru Mwangi (KMPDC/A49281)',
    status: 'PUBLISHED',
    lastUpdated: '2026-08-29'
  }
];

export const ContentLibrary: React.FC = () => {
  const [articles, setArticles] = useState<ContentArticle[]>(INITIAL_ARTICLES);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedArticle, setSelectedArticle] = useState<ContentArticle | null>(null);

  const filtered = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.titleSwahili.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.keyNutrients.some(n => n.toLowerCase().includes(searchTerm.toLowerCase()));
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
                {art.keyNutrients.map((n, i) => (
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">{selectedArticle.title}</h3>
            <p className="text-xs text-teal-700 italic font-semibold mb-4">{selectedArticle.titleSwahili}</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="font-bold text-gray-700 block mb-1">English Clinical Summary:</span>
                <p className="text-gray-800 leading-relaxed">{selectedArticle.summary}</p>
              </div>

              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                <span className="font-bold text-teal-900 block mb-1">Muhtasari wa Kiswahili:</span>
                <p className="text-teal-900 leading-relaxed">{selectedArticle.summarySwahili}</p>
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
