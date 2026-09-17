'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  getHomepageContent,
  updateHomepageContent,
  uploadHomepageAsset,
  getAboutContent,
  updateAboutContent,
  uploadAboutAsset,
} from '@/lib/api';
import { HomepageContent, DEFAULT_HOMEPAGE_CONTENT } from '@/types/homepage';
import { AboutContent, DEFAULT_ABOUT_CONTENT, AboutStat, AboutTimelineItem, AboutValueItem } from '@/types/about';

type PageTab = 'homepage' | 'about';

type HomepageSection = 'hero' | 'brand' | 'category' | 'craftsmanship' | 'journal' | 'cta';
type AboutSection = 'hero' | 'manifesto' | 'break' | 'story' | 'timeline' | 'values' | 'closing';

export default function AdminCMSPage() {
  const [pageTab, setPageTab] = useState<PageTab>('homepage');

  // ─── HOMEPAGE STATE ────────────────────────────────────────────────────────
  const [hpContent, setHpContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [hpLoading, setHpLoading] = useState(true);
  const [hpSaving, setHpSaving] = useState(false);
  const [hpUploadField, setHpUploadField] = useState<string | null>(null);
  const [hpSection, setHpSection] = useState<HomepageSection>('hero');

  // ─── ABOUT STATE ───────────────────────────────────────────────────────────
  const [abContent, setAbContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [abLoading, setAbLoading] = useState(true);
  const [abSaving, setAbSaving] = useState(false);
  const [abUploadField, setAbUploadField] = useState<string | null>(null);
  const [abSection, setAbSection] = useState<AboutSection>('hero');

  // ─── SHARED FEEDBACK ───────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  };
  const showError = (msg: string) => {
    setError(msg);
    setSuccess(null);
  };

  // ─── HOMEPAGE FETCH ─────────────────────────────────────────────────────────
  useEffect(() => {
    setHpLoading(true);
    getHomepageContent()
      .then((data) => setHpContent(data))
      .catch((err) => {
        console.warn('Homepage CMS fetch failed:', err);
        showError('Failed to load homepage content. Defaults shown.');
      })
      .finally(() => setHpLoading(false));
  }, []);

  // ─── ABOUT FETCH ───────────────────────────────────────────────────────────
  useEffect(() => {
    setAbLoading(true);
    getAboutContent()
      .then((data) => setAbContent(data))
      .catch((err) => {
        console.warn('About CMS fetch failed:', err);
        showError('Failed to load about content. Defaults shown.');
      })
      .finally(() => setAbLoading(false));
  }, []);

  // ─── HOMEPAGE SAVE ─────────────────────────────────────────────────────────
  const handleHpSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setHpSaving(true);
    setError(null);
    try {
      const updated = await updateHomepageContent(hpContent);
      setHpContent(updated);
      showSuccess('Homepage content saved successfully!');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to save homepage.');
    } finally {
      setHpSaving(false);
    }
  };

  // ─── ABOUT SAVE ────────────────────────────────────────────────────────────
  const handleAbSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setAbSaving(true);
    setError(null);
    try {
      const updated = await updateAboutContent(abContent);
      setAbContent(updated);
      showSuccess('About page content saved successfully!');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to save about page.');
    } finally {
      setAbSaving(false);
    }
  };

  // ─── HOMEPAGE IMAGE UPLOAD ─────────────────────────────────────────────────
  const handleHpImageUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    onUrl: (url: string) => void,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHpUploadField(fieldName);
    setError(null);
    try {
      const { assetUrl } = await uploadHomepageAsset(file);
      onUrl(assetUrl);
      showSuccess('Image uploaded!');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setHpUploadField(null);
      e.target.value = '';
    }
  };

  // ─── ABOUT IMAGE UPLOAD ────────────────────────────────────────────────────
  const handleAbImageUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    onUrl: (url: string) => void,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAbUploadField(fieldName);
    setError(null);
    try {
      const { assetUrl } = await uploadAboutAsset(file);
      onUrl(assetUrl);
      showSuccess('Image uploaded!');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setAbUploadField(null);
      e.target.value = '';
    }
  };

  // ─── HOMEPAGE HELPERS ──────────────────────────────────────────────────────
  const updateHp = <K extends keyof HomepageContent>(key: K, val: HomepageContent[K]) =>
    setHpContent((p) => ({ ...p, [key]: val }));

  const updateHero = (k: keyof HomepageContent['hero'], v: string) =>
    setHpContent((p) => ({ ...p, hero: { ...p.hero, [k]: v } }));

  const updateBrand = (k: keyof HomepageContent['brandStatement'], v: any) =>
    setHpContent((p) => ({ ...p, brandStatement: { ...p.brandStatement, [k]: v } }));

  const updateCatSection = (k: keyof HomepageContent['categorySection'], v: string) =>
    setHpContent((p) => ({ ...p, categorySection: { ...p.categorySection, [k]: v } }));

  const updateCraft = (k: keyof HomepageContent['craftsmanship'], v: any) =>
    setHpContent((p) => ({ ...p, craftsmanship: { ...p.craftsmanship, [k]: v } }));

  const updateCraftFeat = (idx: number, f: 'icon' | 'title' | 'desc', v: string) => {
    setHpContent((p) => {
      const feats = [...(p.craftsmanship?.features || [])];
      feats[idx] = { ...feats[idx], [f]: v };
      return { ...p, craftsmanship: { ...p.craftsmanship, features: feats } };
    });
  };

  const updateJournal = (k: keyof HomepageContent['journal'], v: string) =>
    setHpContent((p) => ({ ...p, journal: { ...p.journal, [k]: v } }));

  const updateCTA = (k: keyof HomepageContent['cta'], v: any) =>
    setHpContent((p) => ({ ...p, cta: { ...p.cta, [k]: v } }));

  // ─── ABOUT HELPERS ─────────────────────────────────────────────────────────
  const updateAbHero = (k: keyof AboutContent['hero'], v: string) =>
    setAbContent((p) => ({ ...p, hero: { ...p.hero, [k]: v } }));

  const updateManifesto = (k: 'text' | 'highlightText', v: string) =>
    setAbContent((p) => ({ ...p, manifesto: { ...p.manifesto, [k]: v } }));

  const updateStat = (idx: number, f: keyof AboutStat, v: string) => {
    setAbContent((p) => {
      const stats = [...(p.manifesto?.stats || [])];
      stats[idx] = { ...stats[idx], [f]: v };
      return { ...p, manifesto: { ...p.manifesto, stats } };
    });
  };

  const updateStory = (k: 'kicker' | 'title' | 'sub' | 'image' | 'imgBadge', v: string) =>
    setAbContent((p) => ({ ...p, story: { ...p.story, [k]: v } }));

  const updateStoryPt = (idx: number, f: 'title' | 'desc', v: string) => {
    setAbContent((p) => {
      const pts = [...(p.story?.points || [])];
      pts[idx] = { ...pts[idx], [f]: v };
      return { ...p, story: { ...p.story, points: pts } };
    });
  };

  const updateTimelineHdr = (k: 'kicker' | 'title', v: string) =>
    setAbContent((p) => ({ ...p, timeline: { ...p.timeline, [k]: v } }));

  const updateTimelineItem = (idx: number, f: keyof AboutTimelineItem, v: string) => {
    setAbContent((p) => {
      const items = [...(p.timeline?.items || [])];
      items[idx] = { ...items[idx], [f]: v };
      return { ...p, timeline: { ...p.timeline, items } };
    });
  };

  const updateValuesHdr = (k: 'kicker' | 'title', v: string) =>
    setAbContent((p) => ({ ...p, values: { ...p.values, [k]: v } }));

  const updateValueItem = (idx: number, f: keyof AboutValueItem, v: string) => {
    setAbContent((p) => {
      const items = [...(p.values?.items || [])];
      items[idx] = { ...items[idx], [f]: v };
      return { ...p, values: { ...p.values, items } };
    });
  };

  const updateClosing = (k: keyof AboutContent['closing'], v: string) =>
    setAbContent((p) => ({ ...p, closing: { ...p.closing, [k]: v } }));

  // ─── IMAGE UPLOAD WIDGET ───────────────────────────────────────────────────
  const ImageUploadWidget = ({
    currentUrl,
    onUrl,
    onRemove,
    inputId,
    fieldName,
    uploading,
    onFileChange,
  }: {
    currentUrl: string;
    onUrl: (url: string) => void;
    onRemove: () => void;
    inputId: string;
    fieldName: string;
    uploading: boolean;
    onFileChange: (e: ChangeEvent<HTMLInputElement>, onUrl: (url: string) => void, fieldName: string) => void;
  }) => (
    <div className="cms-upload-row">
      {currentUrl ? (
        <div className="cms-image-preview-wrapper">
          <img src={currentUrl} alt="Preview" className="cms-upload-preview" />
          <div className="cms-image-actions">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onFileChange(e, onUrl, fieldName)}
              style={{ display: 'none' }}
              id={inputId}
            />
            <label htmlFor={inputId} className="btn btn-secondary btn-sm">
              {uploading ? 'Uploading...' : 'CHANGE IMAGE'}
            </label>
            <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
              REMOVE
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="cms-no-image-text">No image uploaded</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onFileChange(e, onUrl, fieldName)}
            style={{ display: 'none' }}
            id={inputId}
          />
          <label htmlFor={inputId} className="btn btn-secondary">
            {uploading ? 'Uploading...' : 'UPLOAD IMAGE'}
          </label>
        </div>
      )}
    </div>
  );

  const isLoading = pageTab === 'homepage' ? hpLoading : abLoading;
  const isSaving = pageTab === 'homepage' ? hpSaving : abSaving;

  return (
    <ProtectedRoute>
      <div className="admin-page-wrapper">
        <AdminNavbar />

        <main className="admin-main-content">
          <div className="admin-container">
            {/* Page Header */}
            <div className="admin-page-header">
              <div>
                <span className="admin-small-label">CONTENT MANAGEMENT SYSTEM</span>
                <h1 className="admin-page-title">CMS EDITOR</h1>
              </div>
              <div className="admin-header-actions">
                <button
                  type="button"
                  onClick={() => (pageTab === 'homepage' ? handleHpSave() : handleAbSave())}
                  disabled={isSaving || isLoading}
                  className="btn btn-primary"
                  style={{ minWidth: '160px' }}
                >
                  {isSaving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>

            {/* Feedback Banners */}
            {error && (
              <div className="admin-error-box">
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="admin-success-alert">✓ {success}</div>
            )}

            {/* Top-level Page Tabs */}
            <div className="cms-page-tabs">
              <button
                type="button"
                className={`cms-page-tab-btn ${pageTab === 'homepage' ? 'active' : ''}`}
                onClick={() => setPageTab('homepage')}
              >
                🏠 Homepage
              </button>
              <button
                type="button"
                className={`cms-page-tab-btn ${pageTab === 'about' ? 'active' : ''}`}
                onClick={() => setPageTab('about')}
              >
                📖 About Page
              </button>
            </div>

            {isLoading ? (
              <div className="admin-loading-box">Loading CMS content...</div>
            ) : (
              <div className="admin-cms-card">

                {/* ══════════════════════════════════════════════════════════
                    HOMEPAGE CMS TAB
                ══════════════════════════════════════════════════════════ */}
                {pageTab === 'homepage' && (
                  <>
                    <div className="cms-tabs">
                      {[
                        { id: 'hero', label: '1. Hero' },
                        { id: 'brand', label: '2. Brand Statement' },
                        { id: 'category', label: '3. Category Header' },
                        { id: 'craftsmanship', label: '4. Craftsmanship' },
                        { id: 'journal', label: '5. Journal' },
                        { id: 'cta', label: '6. CTA Banner' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setHpSection(tab.id as HomepageSection)}
                          className={`cms-tab-btn ${hpSection === tab.id ? 'active' : ''}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleHpSave}>
                      {/* HP TAB 1: HERO */}
                      {hpSection === 'hero' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Hero Section Settings</h3>
                          <div className="form-group">
                            <label className="form-label">Kicker / Badge Text</label>
                            <input className="form-input" value={hpContent.hero?.kicker || ''} onChange={(e) => updateHero('kicker', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Hero Title</label>
                            <input className="form-input" value={hpContent.hero?.title || ''} onChange={(e) => updateHero('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Subtitle / Paragraph</label>
                            <textarea rows={3} className="form-input" value={hpContent.hero?.sub || ''} onChange={(e) => updateHero('sub', e.target.value)} />
                          </div>
                          <div className="cms-grid-2">
                            <div className="form-group">
                              <label className="form-label">Primary Button Text</label>
                              <input className="form-input" value={hpContent.hero?.primaryBtnText || ''} onChange={(e) => updateHero('primaryBtnText', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Primary Button Link</label>
                              <input className="form-input" value={hpContent.hero?.primaryBtnLink || ''} onChange={(e) => updateHero('primaryBtnLink', e.target.value)} />
                            </div>
                          </div>
                          <div className="cms-grid-2">
                            <div className="form-group">
                              <label className="form-label">Secondary Button Text</label>
                              <input className="form-input" value={hpContent.hero?.secondaryBtnText || ''} onChange={(e) => updateHero('secondaryBtnText', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Secondary Button Link</label>
                              <input className="form-input" value={hpContent.hero?.secondaryBtnLink || ''} onChange={(e) => updateHero('secondaryBtnLink', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* HP TAB 2: BRAND STATEMENT */}
                      {hpSection === 'brand' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Brand Statement Settings</h3>
                          <div className="cms-grid-2">
                            <div className="form-group">
                              <label className="form-label">Badge Text</label>
                              <input className="form-input" value={hpContent.brandStatement?.badge || ''} onChange={(e) => updateBrand('badge', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Tagline Pill Text</label>
                              <input className="form-input" value={hpContent.brandStatement?.pill || ''} onChange={(e) => updateBrand('pill', e.target.value)} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Main Brand Title</label>
                            <input className="form-input" value={hpContent.brandStatement?.title || ''} onChange={(e) => updateBrand('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Brand Statement Subtitle</label>
                            <textarea rows={4} className="form-input" value={hpContent.brandStatement?.sub || ''} onChange={(e) => updateBrand('sub', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Brand Specs Highlights</label>
                            {(hpContent.brandStatement?.specs || []).map((spec, idx) => (
                              <div key={idx} style={{ marginBottom: '8px' }}>
                                <input
                                  className="form-input"
                                  placeholder={`Spec 0${idx + 1}`}
                                  value={spec || ''}
                                  onChange={(e) => {
                                    const s = [...(hpContent.brandStatement?.specs || [])];
                                    s[idx] = e.target.value;
                                    updateBrand('specs', s);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="cms-grid-2">
                            <div className="form-group">
                              <label className="form-label">CTA Button Text</label>
                              <input className="form-input" value={hpContent.brandStatement?.buttonText || ''} onChange={(e) => updateBrand('buttonText', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">CTA Button Link</label>
                              <input className="form-input" value={hpContent.brandStatement?.buttonLink || ''} onChange={(e) => updateBrand('buttonLink', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* HP TAB 3: CATEGORY */}
                      {hpSection === 'category' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Homepage Category Header</h3>
                          <div className="form-group">
                            <label className="form-label">Kicker Label</label>
                            <input className="form-input" value={hpContent.categorySection?.kicker || ''} onChange={(e) => updateCatSection('kicker', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Category Section Title</label>
                            <input className="form-input" value={hpContent.categorySection?.title || ''} onChange={(e) => updateCatSection('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Category Section Subtitle</label>
                            <input className="form-input" value={hpContent.categorySection?.sub || ''} onChange={(e) => updateCatSection('sub', e.target.value)} />
                          </div>
                        </div>
                      )}

                      {/* HP TAB 4: CRAFTSMANSHIP */}
                      {hpSection === 'craftsmanship' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Craftsmanship Section</h3>
                          <div className="form-group">
                            <label className="form-label">Kicker</label>
                            <input className="form-input" value={hpContent.craftsmanship?.kicker || ''} onChange={(e) => updateCraft('kicker', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Title</label>
                            <input className="form-input" value={hpContent.craftsmanship?.title || ''} onChange={(e) => updateCraft('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea rows={4} className="form-input" value={hpContent.craftsmanship?.sub || ''} onChange={(e) => updateCraft('sub', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Section Feature Image</label>
                            <ImageUploadWidget
                              currentUrl={hpContent.craftsmanship?.image || ''}
                              onUrl={(url) => updateCraft('image', url)}
                              onRemove={() => updateCraft('image', '')}
                              inputId="hp-craft-img"
                              fieldName="craftsmanship"
                              uploading={hpUploadField === 'craftsmanship'}
                              onFileChange={handleHpImageUpload}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Feature Cards</label>
                            {(hpContent.craftsmanship?.features || []).map((feat, idx) => (
                              <div key={idx} className="cms-feature-box">
                                <div className="cms-grid-2">
                                  <input className="form-input" placeholder="Number/Icon" value={feat.icon || ''} onChange={(e) => updateCraftFeat(idx, 'icon', e.target.value)} />
                                  <input className="form-input" placeholder="Feature Title" value={feat.title || ''} onChange={(e) => updateCraftFeat(idx, 'title', e.target.value)} />
                                </div>
                                <textarea rows={2} className="form-input" placeholder="Description" value={feat.desc || ''} onChange={(e) => updateCraftFeat(idx, 'desc', e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* HP TAB 5: JOURNAL */}
                      {hpSection === 'journal' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Journal / Brand Stories Header</h3>
                          <div className="form-group">
                            <label className="form-label">Kicker Tagline</label>
                            <input className="form-input" value={hpContent.journal?.kicker || ''} onChange={(e) => updateJournal('kicker', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Section Title</label>
                            <input className="form-input" value={hpContent.journal?.title || ''} onChange={(e) => updateJournal('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Section Subtitle</label>
                            <input className="form-input" value={hpContent.journal?.sub || ''} onChange={(e) => updateJournal('sub', e.target.value)} />
                          </div>
                        </div>
                      )}

                      {/* HP TAB 6: CTA BANNER */}
                      {hpSection === 'cta' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Bottom CTA Banner</h3>
                          <div className="form-group">
                            <label className="form-label">CTA Badge</label>
                            <input className="form-input" value={hpContent.cta?.badge || ''} onChange={(e) => updateCTA('badge', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">CTA Headline</label>
                            <input className="form-input" value={hpContent.cta?.title || ''} onChange={(e) => updateCTA('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">CTA Subtitle</label>
                            <textarea rows={3} className="form-input" value={hpContent.cta?.sub || ''} onChange={(e) => updateCTA('sub', e.target.value)} />
                          </div>
                          <div className="cms-grid-2">
                            <div className="form-group">
                              <label className="form-label">Primary Button Text</label>
                              <input className="form-input" value={hpContent.cta?.primaryBtnText || ''} onChange={(e) => updateCTA('primaryBtnText', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Primary Button Link</label>
                              <input className="form-input" value={hpContent.cta?.primaryBtnLink || ''} onChange={(e) => updateCTA('primaryBtnLink', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="cms-form-actions">
                        <button type="submit" disabled={hpSaving || hpLoading} className="btn btn-primary">
                          {hpSaving ? 'Saving...' : 'Save Homepage Changes'}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    ABOUT PAGE CMS TAB
                ══════════════════════════════════════════════════════════ */}
                {pageTab === 'about' && (
                  <>
                    <div className="cms-tabs">
                      {[
                        { id: 'hero', label: '1. Hero Banner' },
                        { id: 'manifesto', label: '2. Manifesto & Stats' },
                        { id: 'break', label: '3. Image Break' },
                        { id: 'story', label: '4. Craft & Story' },
                        { id: 'timeline', label: '5. Journey Timeline' },
                        { id: 'values', label: '6. Brand Values' },
                        { id: 'closing', label: '7. Closing CTA' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setAbSection(tab.id as AboutSection)}
                          className={`cms-tab-btn ${abSection === tab.id ? 'active' : ''}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleAbSave}>
                      {/* AB TAB 1: HERO */}
                      {abSection === 'hero' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Hero Banner Settings</h3>
                          <div className="form-group">
                            <label className="form-label">Hero Kicker / Small Label</label>
                            <input className="form-input" value={abContent.hero?.kicker || ''} onChange={(e) => updateAbHero('kicker', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Main Heading</label>
                            <input className="form-input" value={abContent.hero?.title || ''} onChange={(e) => updateAbHero('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Sub Heading / Intro Text</label>
                            <textarea rows={3} className="form-input" value={abContent.hero?.sub || ''} onChange={(e) => updateAbHero('sub', e.target.value)} />
                          </div>
                        </div>
                      )}

                      {/* AB TAB 2: MANIFESTO */}
                      {abSection === 'manifesto' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Brand Manifesto & Key Metrics</h3>
                          <div className="form-group">
                            <label className="form-label">Manifesto Prefix Text</label>
                            <input className="form-input" value={abContent.manifesto?.text || ''} onChange={(e) => updateManifesto('text', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Manifesto Highlighted Text (Italic Accent)</label>
                            <input className="form-input" value={abContent.manifesto?.highlightText || ''} onChange={(e) => updateManifesto('highlightText', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Metric Stats Row (4 Items)</label>
                            {(abContent.manifesto?.stats || []).map((stat, idx) => (
                              <div key={idx} className="cms-feature-box">
                                <div className="cms-grid-2">
                                  <input className="form-input" placeholder="Value (e.g. EST. 2026)" value={stat.value || ''} onChange={(e) => updateStat(idx, 'value', e.target.value)} />
                                  <input className="form-input" placeholder="Label (e.g. Independent studio)" value={stat.label || ''} onChange={(e) => updateStat(idx, 'label', e.target.value)} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AB TAB 3: IMAGE BREAK */}
                      {abSection === 'break' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Wide Banner Image Break</h3>
                          <div className="form-group">
                            <label className="form-label">Wide Studio Image</label>
                            <ImageUploadWidget
                              currentUrl={abContent.imageBreak?.imageUrl || ''}
                              onUrl={(url) => setAbContent((p) => ({ ...p, imageBreak: { ...p.imageBreak, imageUrl: url } }))}
                              onRemove={() => setAbContent((p) => ({ ...p, imageBreak: { ...p.imageBreak, imageUrl: '' } }))}
                              inputId="ab-break-img"
                              fieldName="imageBreak"
                              uploading={abUploadField === 'imageBreak'}
                              onFileChange={handleAbImageUpload}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Image Alt Description</label>
                            <input className="form-input" value={abContent.imageBreak?.altText || ''} onChange={(e) => setAbContent((p) => ({ ...p, imageBreak: { ...p.imageBreak, altText: e.target.value } }))} />
                          </div>
                        </div>
                      )}

                      {/* AB TAB 4: STORY */}
                      {abSection === 'story' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Craftsmanship & Story Section</h3>
                          <div className="form-group">
                            <label className="form-label">Kicker Label</label>
                            <input className="form-input" value={abContent.story?.kicker || ''} onChange={(e) => updateStory('kicker', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Section Title</label>
                            <input className="form-input" value={abContent.story?.title || ''} onChange={(e) => updateStory('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Description Paragraph</label>
                            <textarea rows={3} className="form-input" value={abContent.story?.sub || ''} onChange={(e) => updateStory('sub', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Craftsmanship Feature Image</label>
                            <ImageUploadWidget
                              currentUrl={abContent.story?.image || ''}
                              onUrl={(url) => updateStory('image', url)}
                              onRemove={() => updateStory('image', '')}
                              inputId="ab-story-img"
                              fieldName="story"
                              uploading={abUploadField === 'story'}
                              onFileChange={handleAbImageUpload}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Image Badge Overlay Text</label>
                            <input className="form-input" value={abContent.story?.imgBadge || ''} onChange={(e) => updateStory('imgBadge', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Craft Points List</label>
                            {(abContent.story?.points || []).map((pt, idx) => (
                              <div key={idx} className="cms-feature-box">
                                <input className="form-input" placeholder="Title (e.g. Solid Brass)" value={pt.title || ''} onChange={(e) => updateStoryPt(idx, 'title', e.target.value)} />
                                <textarea rows={2} className="form-input" placeholder="Description" value={pt.desc || ''} onChange={(e) => updateStoryPt(idx, 'desc', e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AB TAB 5: TIMELINE */}
                      {abSection === 'timeline' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Timeline & Journey Section</h3>
                          <div className="form-group">
                            <label className="form-label">Section Kicker</label>
                            <input className="form-input" value={abContent.timeline?.kicker || ''} onChange={(e) => updateTimelineHdr('kicker', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Section Heading</label>
                            <input className="form-input" value={abContent.timeline?.title || ''} onChange={(e) => updateTimelineHdr('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Timeline Items</label>
                            {(abContent.timeline?.items || []).map((item, idx) => (
                              <div key={idx} className="cms-feature-box">
                                <div className="cms-grid-2">
                                  <input className="form-input" placeholder="Year/Tag (e.g. 2026 — BEGIN)" value={item.year || ''} onChange={(e) => updateTimelineItem(idx, 'year', e.target.value)} />
                                  <input className="form-input" placeholder="Title" value={item.title || ''} onChange={(e) => updateTimelineItem(idx, 'title', e.target.value)} />
                                </div>
                                <textarea rows={2} className="form-input" placeholder="Description" value={item.desc || ''} onChange={(e) => updateTimelineItem(idx, 'desc', e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AB TAB 6: VALUES */}
                      {abSection === 'values' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Brand Values Cards</h3>
                          <div className="form-group">
                            <label className="form-label">Section Kicker</label>
                            <input className="form-input" value={abContent.values?.kicker || ''} onChange={(e) => updateValuesHdr('kicker', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Section Heading</label>
                            <input className="form-input" value={abContent.values?.title || ''} onChange={(e) => updateValuesHdr('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Value Cards (3 Items)</label>
                            {(abContent.values?.items || []).map((valItem, idx) => (
                              <div key={idx} className="cms-feature-box">
                                <div className="cms-grid-2">
                                  <input className="form-input" placeholder="Icon (e.g. ✦, ❤, ↻)" value={valItem.icon || ''} onChange={(e) => updateValueItem(idx, 'icon', e.target.value)} />
                                  <input className="form-input" placeholder="Title (e.g. Craft over mass)" value={valItem.title || ''} onChange={(e) => updateValueItem(idx, 'title', e.target.value)} />
                                </div>
                                <textarea rows={2} className="form-input" placeholder="Description" value={valItem.desc || ''} onChange={(e) => updateValueItem(idx, 'desc', e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AB TAB 7: CLOSING CTA */}
                      {abSection === 'closing' && (
                        <div className="cms-tab-content">
                          <h3 className="cms-tab-title">Closing Banner & Action Buttons</h3>
                          <div className="form-group">
                            <label className="form-label">Main Closing Title Prefix</label>
                            <input className="form-input" value={abContent.closing?.title || ''} onChange={(e) => updateClosing('title', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Closing Title Highlight (Italic Accent)</label>
                            <input className="form-input" value={abContent.closing?.highlightText || ''} onChange={(e) => updateClosing('highlightText', e.target.value)} />
                          </div>
                          <div className="cms-grid-2">
                            <div className="form-group">
                              <label className="form-label">Primary Button Text</label>
                              <input className="form-input" value={abContent.closing?.primaryBtnText || ''} onChange={(e) => updateClosing('primaryBtnText', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Primary Button Link</label>
                              <input className="form-input" value={abContent.closing?.primaryBtnLink || ''} onChange={(e) => updateClosing('primaryBtnLink', e.target.value)} />
                            </div>
                          </div>
                          <div className="cms-grid-2">
                            <div className="form-group">
                              <label className="form-label">Secondary Button Text</label>
                              <input className="form-input" value={abContent.closing?.secondaryBtnText || ''} onChange={(e) => updateClosing('secondaryBtnText', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Secondary Button Link</label>
                              <input className="form-input" value={abContent.closing?.secondaryBtnLink || ''} onChange={(e) => updateClosing('secondaryBtnLink', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="cms-form-actions">
                        <button type="submit" disabled={abSaving || abLoading} className="btn btn-primary">
                          {abSaving ? 'Saving...' : 'Save About Page Changes'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
