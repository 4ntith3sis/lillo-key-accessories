'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getAboutContent, updateAboutContent, uploadAboutAsset } from '@/lib/api';
import { AboutContent, DEFAULT_ABOUT_CONTENT, AboutStat, AboutTimelineItem, AboutValueItem } from '@/types/about';

export default function AdminAboutCMSPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'manifesto' | 'break' | 'story' | 'timeline' | 'values' | 'closing'>('hero');

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAboutContent();
      setContent(data);
    } catch (err: unknown) {
      console.warn('Failed to load About CMS content:', err);
      setError('Failed to fetch About content. Defaults loaded.');
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
      const updated = await updateAboutContent(content);
      setContent(updated);
      setSuccess('About page content updated successfully!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      console.error('Error saving About content:', err);
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
      const { assetUrl } = await uploadAboutAsset(file);
      onUrlReceived(assetUrl);
      setSuccess('Image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Asset upload failed.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  // Helper updaters
  const updateHero = (key: keyof AboutContent['hero'], val: string) => {
    setContent((prev) => ({
      ...prev,
      hero: { ...prev.hero, [key]: val }
    }));
  };

  const updateManifesto = (key: 'text' | 'highlightText', val: string) => {
    setContent((prev) => ({
      ...prev,
      manifesto: { ...prev.manifesto, [key]: val }
    }));
  };

  const updateStat = (idx: number, field: keyof AboutStat, val: string) => {
    setContent((prev) => {
      const newStats = [...(prev.manifesto?.stats || [])];
      newStats[idx] = { ...newStats[idx], [field]: val };
      return {
        ...prev,
        manifesto: { ...prev.manifesto, stats: newStats }
      };
    });
  };

  const updateStory = (key: 'kicker' | 'title' | 'sub' | 'image' | 'imgBadge', val: string) => {
    setContent((prev) => ({
      ...prev,
      story: { ...prev.story, [key]: val }
    }));
  };

  const updateStoryPoint = (idx: number, field: 'title' | 'desc', val: string) => {
    setContent((prev) => {
      const newPoints = [...(prev.story?.points || [])];
      newPoints[idx] = { ...newPoints[idx], [field]: val };
      return {
        ...prev,
        story: { ...prev.story, points: newPoints }
      };
    });
  };

  const updateTimelineHeader = (key: 'kicker' | 'title', val: string) => {
    setContent((prev) => ({
      ...prev,
      timeline: { ...prev.timeline, [key]: val }
    }));
  };

  const updateTimelineItem = (idx: number, field: keyof AboutTimelineItem, val: string) => {
    setContent((prev) => {
      const newItems = [...(prev.timeline?.items || [])];
      newItems[idx] = { ...newItems[idx], [field]: val };
      return {
        ...prev,
        timeline: { ...prev.timeline, items: newItems }
      };
    });
  };

  const updateValuesHeader = (key: 'kicker' | 'title', val: string) => {
    setContent((prev) => ({
      ...prev,
      values: { ...prev.values, [key]: val }
    }));
  };

  const updateValueItem = (idx: number, field: keyof AboutValueItem, val: string) => {
    setContent((prev) => {
      const newItems = [...(prev.values?.items || [])];
      newItems[idx] = { ...newItems[idx], [field]: val };
      return {
        ...prev,
        values: { ...prev.values, items: newItems }
      };
    });
  };

  const updateClosing = (key: keyof AboutContent['closing'], val: string) => {
    setContent((prev) => ({
      ...prev,
      closing: { ...prev.closing, [key]: val }
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
                <h1 className="admin-page-title">ABOUT PAGE CONTENT CMS</h1>
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
                Loading About CMS content...
              </div>
            ) : (
              <div className="admin-cms-card">
                {/* CMS Section Navigation Tabs */}
                <div className="cms-tabs">
                  {[
                    { id: 'hero', label: '1. Hero Banner' },
                    { id: 'manifesto', label: '2. Manifesto & Stats' },
                    { id: 'break', label: '3. Image Break' },
                    { id: 'story', label: '4. Craft & Story' },
                    { id: 'timeline', label: '5. Journey Timeline' },
                    { id: 'values', label: '6. Brand Values' },
                    { id: 'closing', label: '7. Closing CTA' }
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
                      <h3 className="cms-tab-title">Hero Banner Settings</h3>

                      <div className="form-group">
                        <label className="form-label">Hero Kicker / Small Label</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.hero?.kicker || ''}
                          onChange={(e) => updateHero('kicker', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Main Heading</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.hero?.title || ''}
                          onChange={(e) => updateHero('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Sub Heading / Intro Text</label>
                        <textarea
                          rows={3}
                          className="form-input"
                          value={content.hero?.sub || ''}
                          onChange={(e) => updateHero('sub', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: MANIFESTO & STATS */}
                  {activeTab === 'manifesto' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Brand Manifesto & Key Metrics</h3>

                      <div className="form-group">
                        <label className="form-label">Manifesto Prefix Text</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.manifesto?.text || ''}
                          onChange={(e) => updateManifesto('text', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Manifesto Highlighted Text (Italic Accent)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.manifesto?.highlightText || ''}
                          onChange={(e) => updateManifesto('highlightText', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Metric Stats Row (4 Items)</label>
                        {(content.manifesto?.stats || []).map((stat, idx) => (
                          <div key={idx} className="cms-feature-box">
                            <div className="cms-grid-2">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Value (e.g. EST. 2026)"
                                value={stat.value || ''}
                                onChange={(e) => updateStat(idx, 'value', e.target.value)}
                              />
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Label (e.g. Independent studio)"
                                value={stat.label || ''}
                                onChange={(e) => updateStat(idx, 'label', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: IMAGE BREAK */}
                  {activeTab === 'break' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Wide Banner Image Break</h3>

                      <div className="form-group">
                        <label className="form-label">Wide Studio Image</label>
                        <div className="cms-upload-row">
                          {content.imageBreak?.imageUrl ? (
                            <div className="cms-image-preview-wrapper">
                              <img
                                src={content.imageBreak.imageUrl}
                                alt="Image Break Preview"
                                className="cms-upload-preview"
                              />
                              <div className="cms-image-actions">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => handleImageUpload(e, (url) => setContent(prev => ({ ...prev, imageBreak: { ...prev.imageBreak, imageUrl: url } })), 'imageBreak')}
                                  style={{ display: 'none' }}
                                  id="break-image-input"
                                />
                                <label htmlFor="break-image-input" className="btn btn-secondary btn-sm">
                                  {uploadingField === 'imageBreak' ? 'Uploading...' : 'CHANGE IMAGE'}
                                </label>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => setContent(prev => ({ ...prev, imageBreak: { ...prev.imageBreak, imageUrl: '' } }))}
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
                                onChange={(e) => handleImageUpload(e, (url) => setContent(prev => ({ ...prev, imageBreak: { ...prev.imageBreak, imageUrl: url } })), 'imageBreak')}
                                style={{ display: 'none' }}
                                id="break-image-input"
                              />
                              <label htmlFor="break-image-input" className="btn btn-secondary">
                                {uploadingField === 'break' ? 'Uploading...' : 'UPLOAD IMAGE'}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Image Alt Description</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.imageBreak?.altText || ''}
                          onChange={(e) => setContent(prev => ({ ...prev, imageBreak: { ...prev.imageBreak, altText: e.target.value } }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 4: STORY & CRAFT */}
                  {activeTab === 'story' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Craftsmanship & Story Section</h3>

                      <div className="form-group">
                        <label className="form-label">Kicker Label</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.story?.kicker || ''}
                          onChange={(e) => updateStory('kicker', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Section Title</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.story?.title || ''}
                          onChange={(e) => updateStory('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description Paragraph</label>
                        <textarea
                          rows={3}
                          className="form-input"
                          value={content.story?.sub || ''}
                          onChange={(e) => updateStory('sub', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Craftsmanship Feature Image</label>
                        <div className="cms-upload-row">
                          {content.story?.image ? (
                            <div className="cms-image-preview-wrapper">
                              <img
                                src={content.story.image}
                                alt="Story craft preview"
                                className="cms-upload-preview"
                              />
                              <div className="cms-image-actions">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => handleImageUpload(e, (url) => updateStory('image', url), 'story')}
                                  style={{ display: 'none' }}
                                  id="story-image-input"
                                />
                                <label htmlFor="story-image-input" className="btn btn-secondary btn-sm">
                                  {uploadingField === 'story' ? 'Uploading...' : 'CHANGE IMAGE'}
                                </label>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => updateStory('image', '')}
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
                                onChange={(e) => handleImageUpload(e, (url) => updateStory('image', url), 'story')}
                                style={{ display: 'none' }}
                                id="story-image-input"
                              />
                              <label htmlFor="story-image-input" className="btn btn-secondary">
                                {uploadingField === 'story' ? 'Uploading...' : 'UPLOAD IMAGE'}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Image Badge Overlay Text</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.story?.imgBadge || ''}
                          onChange={(e) => updateStory('imgBadge', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Craft Points List</label>
                        {(content.story?.points || []).map((pt, idx) => (
                          <div key={idx} className="cms-feature-box">
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Title (e.g. Solid Brass)"
                              value={pt.title || ''}
                              onChange={(e) => updateStoryPoint(idx, 'title', e.target.value)}
                            />
                            <textarea
                              rows={2}
                              className="form-input"
                              placeholder="Description"
                              value={pt.desc || ''}
                              onChange={(e) => updateStoryPoint(idx, 'desc', e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: TIMELINE */}
                  {activeTab === 'timeline' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Timeline & Journey Section</h3>

                      <div className="form-group">
                        <label className="form-label">Section Kicker</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.timeline?.kicker || ''}
                          onChange={(e) => updateTimelineHeader('kicker', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Section Heading</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.timeline?.title || ''}
                          onChange={(e) => updateTimelineHeader('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Timeline Items</label>
                        {(content.timeline?.items || []).map((item, idx) => (
                          <div key={idx} className="cms-feature-box">
                            <div className="cms-grid-2">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Year/Tag (e.g. 2026 — BEGIN)"
                                value={item.year || ''}
                                onChange={(e) => updateTimelineItem(idx, 'year', e.target.value)}
                              />
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Title"
                                value={item.title || ''}
                                onChange={(e) => updateTimelineItem(idx, 'title', e.target.value)}
                              />
                            </div>
                            <textarea
                              rows={2}
                              className="form-input"
                              placeholder="Description"
                              value={item.desc || ''}
                              onChange={(e) => updateTimelineItem(idx, 'desc', e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: VALUES */}
                  {activeTab === 'values' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Brand Values Cards</h3>

                      <div className="form-group">
                        <label className="form-label">Section Kicker</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.values?.kicker || ''}
                          onChange={(e) => updateValuesHeader('kicker', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Section Heading</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.values?.title || ''}
                          onChange={(e) => updateValuesHeader('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Value Cards (3 Items)</label>
                        {(content.values?.items || []).map((valItem, idx) => (
                          <div key={idx} className="cms-feature-box">
                            <div className="cms-grid-2">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Icon (e.g. ✦, ❤, ↻)"
                                value={valItem.icon || ''}
                                onChange={(e) => updateValueItem(idx, 'icon', e.target.value)}
                              />
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Title (e.g. Craft over mass)"
                                value={valItem.title || ''}
                                onChange={(e) => updateValueItem(idx, 'title', e.target.value)}
                              />
                            </div>
                            <textarea
                              rows={2}
                              className="form-input"
                              placeholder="Description"
                              value={valItem.desc || ''}
                              onChange={(e) => updateValueItem(idx, 'desc', e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 7: CLOSING CTA */}
                  {activeTab === 'closing' && (
                    <div className="cms-tab-content">
                      <h3 className="cms-tab-title">Closing Banner & Action Buttons</h3>

                      <div className="form-group">
                        <label className="form-label">Main Closing Title Prefix</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.closing?.title || ''}
                          onChange={(e) => updateClosing('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Closing Title Highlight (Italic Accent)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={content.closing?.highlightText || ''}
                          onChange={(e) => updateClosing('highlightText', e.target.value)}
                        />
                      </div>

                      <div className="cms-grid-2">
                        <div className="form-group">
                          <label className="form-label">Primary Button Text</label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.closing?.primaryBtnText || ''}
                            onChange={(e) => updateClosing('primaryBtnText', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Primary Button Link</label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.closing?.primaryBtnLink || ''}
                            onChange={(e) => updateClosing('primaryBtnLink', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="cms-grid-2">
                        <div className="form-group">
                          <label className="form-label">Secondary Button Text</label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.closing?.secondaryBtnText || ''}
                            onChange={(e) => updateClosing('secondaryBtnText', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Secondary Button Link</label>
                          <input
                            type="text"
                            className="form-input"
                            value={content.closing?.secondaryBtnLink || ''}
                            onChange={(e) => updateClosing('secondaryBtnLink', e.target.value)}
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
