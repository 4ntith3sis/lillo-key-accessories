'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getHomepageContent, updateHomepageContent, uploadHomepageAsset } from '@/lib/api';
import { HomepageContent, DEFAULT_HOMEPAGE_CONTENT } from '@/types/homepage';

export default function AdminHomepageCMSPage() {
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'brand' | 'category' | 'craftsmanship' | 'journal' | 'cta'>('hero');

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHomepageContent();
      setContent(data);
    } catch (err: unknown) {
      console.warn('Failed to load homepage CMS content:', err);
      setError('Failed to fetch CMS content. Standard defaults loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateHomepageContent(content);
      setContent(updated);
      setSuccess('Homepage content updated successfully!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      console.error('Error saving homepage content:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save content.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, onUrlReceived: (url: string) => void, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    setError(null);
    try {
      const { assetUrl } = await uploadHomepageAsset(file);
      onUrlReceived(assetUrl);
      setSuccess(`Image uploaded successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Asset upload failed.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  // Helper updates
  const updateHero = (key: keyof HomepageContent['hero'], val: string) => {
    setContent((prev) => ({
      ...prev,
      hero: { ...prev.hero, [key]: val }
    }));
  };

  const updateBrand = (key: keyof HomepageContent['brandStatement'], val: any) => {
    setContent((prev) => ({
      ...prev,
      brandStatement: { ...prev.brandStatement, [key]: val }
    }));
  };

  const updateCategorySection = (key: keyof HomepageContent['categorySection'], val: string) => {
    setContent((prev) => ({
      ...prev,
      categorySection: { ...prev.categorySection, [key]: val }
    }));
  };

  const updateCraftsmanship = (key: keyof HomepageContent['craftsmanship'], val: any) => {
    setContent((prev) => ({
      ...prev,
      craftsmanship: { ...prev.craftsmanship, [key]: val }
    }));
  };

  const updateCraftFeature = (idx: number, field: 'icon' | 'title' | 'desc', val: string) => {
    setContent((prev) => {
      const newFeats = [...(prev.craftsmanship?.features || [])];
      newFeats[idx] = { ...newFeats[idx], [field]: val };
      return {
        ...prev,
        craftsmanship: { ...prev.craftsmanship, features: newFeats }
      };
    });
  };

  const updateJournal = (key: keyof HomepageContent['journal'], val: string) => {
    setContent((prev) => ({
      ...prev,
      journal: { ...prev.journal, [key]: val }
    }));
  };

  const updateCTA = (key: keyof HomepageContent['cta'], val: any) => {
    setContent((prev) => ({
      ...prev,
      cta: { ...prev.cta, [key]: val }
    }));
  };

  return (
    <ProtectedRoute>
      <div className="admin-page-wrapper">
        <AdminNavbar />

        <main className="admin-main-content">
          <div className="admin-container">
            <div className="admin-page-header">
              <div>
                <span className="admin-small-label">CONTENT MANAGEMENT SYSTEM</span>
                <h1 className="admin-page-title">HOMEPAGE CONTENT CMS</h1>
              </div>
              <div className="admin-header-actions">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving || loading}
                  className="btn btn-primary"
                  style={{ minWidth: '140px' }}
                >
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>

            {error && (
              <div className="admin-error-box">
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="admin-success-alert">
                ✓ {success}
              </div>
            )}

            {loading ? (
              <div className="admin-loading-box">
                Loading CMS content...
              </div>
            ) : (
              <div className="admin-cms-card">
                {/* CMS Section Navigation Tabs */}
                <div className="cms-tabs">
                  {[
                    { id: 'hero', label: '1. Hero Section' },
                    { id: 'brand', label: '2. Brand Statement' },
                    { id: 'category', label: '3. Category Header' },
                    { id: 'craftsmanship', label: '4. Craftsmanship' },
                    { id: 'journal', label: '5. Journal' },
                    { id: 'cta', label: '6. CTA Banner' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`cms-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSave}>
                  {/* TAB 1: HERO */}
                  {activeTab === 'hero' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Hero Section Settings</h3>

                      <div className="form-group">
                        <label className="form-label">
                          Kicker / Badge Text
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.hero?.kicker || ''}
                          onChange={(e) => updateHero('kicker', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Hero Title
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.hero?.title || ''}
                          onChange={(e) => updateHero('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Subtitle / Paragraph
                        </label>
                        <textarea
                          rows={3}
                          className="form-input"
                          value={content.hero?.sub || ''}
                          onChange={(e) => updateHero('sub', e.target.value)}
                        />
                      </div>

                      <div className="cms-grid-2">
                        <div className="form-group">
                          <label className="form-label">
                            Primary Button Text
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.hero?.primaryBtnText || ''}
                            onChange={(e) => updateHero('primaryBtnText', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Primary Button Link
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.hero?.primaryBtnLink || ''}
                            onChange={(e) => updateHero('primaryBtnLink', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="cms-grid-2">
                        <div className="form-group">
                          <label className="form-label">
                            Secondary Button Text
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.hero?.secondaryBtnText || ''}
                            onChange={(e) => updateHero('secondaryBtnText', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Secondary Button Link
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.hero?.secondaryBtnLink || ''}
                            onChange={(e) => updateHero('secondaryBtnLink', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BRAND STATEMENT */}
                  {activeTab === 'brand' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Brand Statement Settings</h3>

                      <div className="cms-grid-2">
                        <div className="form-group">
                          <label className="form-label">
                            Badge Text
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.brandStatement?.badge || ''}
                            onChange={(e) => updateBrand('badge', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Tagline Pill Text
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.brandStatement?.pill || ''}
                            onChange={(e) => updateBrand('pill', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Main Brand Title
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.brandStatement?.title || ''}
                          onChange={(e) => updateBrand('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Brand Statement Subtitle
                        </label>
                        <textarea
                          rows={4}
                          className="form-input"
                          value={content.brandStatement?.sub || ''}
                          onChange={(e) => updateBrand('sub', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Brand Specs Highlights
                        </label>
                        {(content.brandStatement?.specs || []).map((spec, idx) => (
                          <div key={idx} style={{ marginBottom: '8px' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder={`Spec 0${idx + 1}`}
                              value={spec || ''}
                              onChange={(e) => {
                                const newSpecs = [...(content.brandStatement?.specs || [])];
                                newSpecs[idx] = e.target.value;
                                updateBrand('specs', newSpecs);
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="cms-grid-2">
                        <div className="form-group">
                          <label className="form-label">
                            CTA Button Text
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.brandStatement?.buttonText || ''}
                            onChange={(e) => updateBrand('buttonText', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            CTA Button Link
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.brandStatement?.buttonLink || ''}
                            onChange={(e) => updateBrand('buttonLink', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CATEGORY SECTION */}
                  {activeTab === 'category' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Homepage Category Header</h3>

                      <div className="form-group">
                        <label className="form-label">
                          Kicker Label
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.categorySection?.kicker || ''}
                          onChange={(e) => updateCategorySection('kicker', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Category Section Title
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.categorySection?.title || ''}
                          onChange={(e) => updateCategorySection('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Category Section Subtitle
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.categorySection?.sub || ''}
                          onChange={(e) => updateCategorySection('sub', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 4: CRAFTSMANSHIP */}
                  {activeTab === 'craftsmanship' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Craftsmanship Section</h3>

                      <div className="form-group">
                        <label className="form-label">
                          Kicker
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.craftsmanship?.kicker || ''}
                          onChange={(e) => updateCraftsmanship('kicker', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Title
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.craftsmanship?.title || ''}
                          onChange={(e) => updateCraftsmanship('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Description
                        </label>
                        <textarea
                          rows={4}
                          className="form-input"
                          value={content.craftsmanship?.sub || ''}
                          onChange={(e) => updateCraftsmanship('sub', e.target.value)}
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="form-group">
                        <label className="form-label">
                          Section Feature Image
                        </label>
                        <div className="cms-upload-row">
                          {content.craftsmanship?.image ? (
                            <div className="cms-image-preview-wrapper">
                              <img
                                src={content.craftsmanship.image}
                                alt="Craftsmanship preview"
                                className="cms-upload-preview"
                              />
                              <div className="cms-image-actions">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => handleImageUpload(e, (url) => updateCraftsmanship('image', url), 'craftsmanship')}
                                  style={{ display: 'none' }}
                                  id="craft-image-input"
                                />
                                <label
                                  htmlFor="craft-image-input"
                                  className="btn btn-secondary btn-sm"
                                >
                                  {uploadingField === 'craftsmanship' ? 'Uploading...' : 'CHANGE IMAGE'}
                                </label>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => updateCraftsmanship('image', '')}
                                >
                                  REMOVE IMAGE
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="cms-no-image-text">No image uploaded</p>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => handleImageUpload(e, (url) => updateCraftsmanship('image', url), 'craftsmanship')}
                                style={{ display: 'none' }}
                                id="craft-image-input"
                              />
                              <label
                                htmlFor="craft-image-input"
                                className="btn btn-secondary"
                              >
                                {uploadingField === 'craftsmanship' ? 'Uploading...' : 'UPLOAD IMAGE'}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Craftsmanship Features */}
                      <div className="form-group">
                        <label className="form-label">
                          Craftsmanship Feature Cards
                        </label>
                        {(content.craftsmanship?.features || []).map((feat, idx) => (
                          <div key={idx} className="cms-feature-box">
                            <div className="cms-grid-2">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="01"
                                value={feat.icon || ''}
                                onChange={(e) => updateCraftFeature(idx, 'icon', e.target.value)}
                              />
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Feature Title"
                                value={feat.title || ''}
                                onChange={(e) => updateCraftFeature(idx, 'title', e.target.value)}
                              />
                            </div>
                            <textarea
                              rows={2}
                              className="form-input"
                              placeholder="Feature description"
                              value={feat.desc || ''}
                              onChange={(e) => updateCraftFeature(idx, 'desc', e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: JOURNAL */}
                  {activeTab === 'journal' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Journal / Brand Stories Header</h3>

                      <div className="form-group">
                        <label className="form-label">
                          Kicker Tagline
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.journal?.kicker || ''}
                          onChange={(e) => updateJournal('kicker', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Section Title
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.journal?.title || ''}
                          onChange={(e) => updateJournal('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Section Subtitle
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.journal?.sub || ''}
                          onChange={(e) => updateJournal('sub', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 6: CTA BANNER */}
                  {activeTab === 'cta' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Bottom CTA Banner</h3>

                      <div className="form-group">
                        <label className="form-label">
                          CTA Badge
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.cta?.badge || ''}
                          onChange={(e) => updateCTA('badge', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          CTA Headline
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.cta?.title || ''}
                          onChange={(e) => updateCTA('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          CTA Subtitle
                        </label>
                        <textarea
                          rows={3}
                          className="form-input"
                          value={content.cta?.sub || ''}
                          onChange={(e) => updateCTA('sub', e.target.value)}
                        />
                      </div>

                      <div className="cms-grid-2">
                        <div className="form-group">
                          <label className="form-label">
                            Primary Button Text
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.cta?.primaryBtnText || ''}
                            onChange={(e) => updateCTA('primaryBtnText', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Primary Button Link
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.cta?.primaryBtnLink || ''}
                            onChange={(e) => updateCTA('primaryBtnLink', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="cms-form-actions">
                    <button
                      type="submit"
                      disabled={saving || loading}
                      className="btn btn-primary"
                    >
                      {saving ? 'Saving Content...' : 'Save All Section Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
