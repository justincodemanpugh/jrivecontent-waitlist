"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink, Play, Eye, Heart, MessageCircle } from "lucide-react";

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "youtube", label: "YouTube", icon: "🎬" },
];

export default function VideoShowcaseUploader({ 
  videos, 
  onVideosChange,
  onValidationChange 
}) {
  const [newVideo, setNewVideo] = useState({
    platform: "instagram",
    video_url: "",
    title: "",
    views: "",
    likes: "",
    comments: "",
  });

  const addVideo = () => {
    if (!newVideo.video_url.trim()) return;

    const video = {
      id: Date.now().toString(),
      platform: newVideo.platform,
      video_url: newVideo.video_url.trim(),
      title: newVideo.title.trim() || `Video ${videos.length + 1}`,
      views: parseInt(newVideo.views) || 0,
      likes: parseInt(newVideo.likes) || 0,
      comments: parseInt(newVideo.comments) || 0,
    };

    const updatedVideos = [...videos, video];
    onVideosChange(updatedVideos);
    
    // Reset form
    setNewVideo({
      platform: "instagram",
      video_url: "",
      title: "",
      views: "",
      likes: "",
      comments: "",
    });
    
    onValidationChange(updatedVideos.length > 0);
  };

  const removeVideo = (id) => {
    const updatedVideos = videos.filter(v => v.id !== id);
    onVideosChange(updatedVideos);
    onValidationChange(updatedVideos.length > 0);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getPlatformUrlPattern = (platform) => {
    switch (platform) {
      case "instagram":
        return /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\//;
      case "tiktok":
        return /^https?:\/\/(www\.)?tiktok\.com\/@/;
      case "youtube":
        return /^https?:\/\/(www\.)?youtube\.com\/(watch|shorts)/;
      default:
        return /.*/;
    }
  };

  const hasValidVideos = videos.length > 0;
  const canAddVideo = newVideo.video_url.trim() && isValidUrl(newVideo.video_url);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              hasValidVideos ? 'bg-green-500' : 'bg-amber-500'
            }`}>
              {hasValidVideos ? (
                <Play size={12} className="text-white" />
              ) : (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900">
              {hasValidVideos ? "Best videos added!" : "Add your best performing videos"}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Show brands your content quality with engagement metrics. Add 3-5 of your best videos.
            </p>
          </div>
        </div>
      </div>

      {/* Add new video form */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <h3 className="text-sm font-medium text-brand-ink">Add Video</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Platform</label>
            <select
              value={newVideo.platform}
              onChange={(e) => setNewVideo(prev => ({ ...prev, platform: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
            >
              {PLATFORM_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Video URL</label>
            <input
              type="url"
              value={newVideo.video_url}
              onChange={(e) => setNewVideo(prev => ({ ...prev, video_url: e.target.value }))}
              placeholder={`https://instagram.com/p/...`}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-brand-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-sky/30 ${
                newVideo.video_url && !isValidUrl(newVideo.video_url) 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-slate-200 focus:border-brand-skyDeep'
              }`}
            />
            {newVideo.video_url && !isValidUrl(newVideo.video_url) && (
              <p className="mt-1 text-xs text-red-600">Please enter a valid URL</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Title (optional)</label>
          <input
            type="text"
            value={newVideo.title}
            onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
            placeholder="My best performing video"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              <Eye size={12} className="inline mr-1" />Views
            </label>
            <input
              type="number"
              min="0"
              value={newVideo.views}
              onChange={(e) => setNewVideo(prev => ({ ...prev, views: e.target.value }))}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              <Heart size={12} className="inline mr-1" />Likes
            </label>
            <input
              type="number"
              min="0"
              value={newVideo.likes}
              onChange={(e) => setNewVideo(prev => ({ ...prev, likes: e.target.value }))}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              <MessageCircle size={12} className="inline mr-1" />Comments
            </label>
            <input
              type="number"
              min="0"
              value={newVideo.comments}
              onChange={(e) => setNewVideo(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={addVideo}
          disabled={!canAddVideo}
          className="inline-flex items-center gap-2 rounded-full bg-brand-skyDeep px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          Add Video
        </button>
      </div>

      {/* Added videos list */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-brand-ink">Your Best Videos ({videos.length})</h3>
          {videos.map((video, index) => (
            <div key={video.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {PLATFORM_OPTIONS.find(p => p.value === video.platform)?.icon}
                    </span>
                    <span className="text-sm font-medium text-brand-ink">{video.title}</span>
                    <span className="text-xs text-slate-500">#{index + 1}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {video.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {video.likes.toLocaleString()} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} /> {video.comments.toLocaleString()} comments
                    </span>
                  </div>
                  
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-skyDeep hover:underline"
                  >
                    <ExternalLink size={12} />
                    View original
                  </a>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeVideo(video.id)}
                  className="ml-4 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasValidVideos && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800">
            <strong>Required:</strong> Add at least one of your best videos to continue.
          </p>
        </div>
      )}
    </div>
  );
}
