import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-(--color-amf-creme) min-w-0" data-page="courses-loading">
      {/* HEADER SKELETON */}
      <header className="w-full bg-[#160820] pt-10 sm:pt-14 pb-8 rounded-b-[24px]">
        <div className="w-full max-w-(--amf-content-max) mx-auto px-4 sm:px-[var(--page-gutter)]">
          <div className="flex justify-between items-center mb-8">
            <div className="w-16 h-8 bg-white/10 rounded animate-pulse"></div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
              <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
            </div>
          </div>
          <div className="w-2/3 h-10 bg-white/10 rounded animate-pulse mb-3"></div>
          <div className="w-1/2 h-5 bg-white/5 rounded animate-pulse mb-8"></div>
          
          <div className="w-full h-12 bg-white/10 rounded-xl animate-pulse mb-8"></div>
          
          <div className="flex w-full divide-x divide-white/10">
            <div className="flex-1 h-12 bg-white/5 animate-pulse mx-2"></div>
            <div className="flex-1 h-12 bg-white/5 animate-pulse mx-2"></div>
            <div className="flex-1 h-12 bg-white/5 animate-pulse mx-2"></div>
          </div>
        </div>
      </header>

      {/* MAIN SKELETON */}
      <main className="w-full max-w-(--amf-content-max) mx-auto px-4 sm:px-[var(--page-gutter)] pt-6">
        <div className="w-full h-12 bg-gray-200 rounded-[20px] animate-pulse mb-5"></div>
        
        <div className="flex gap-2 mb-8">
          <div className="w-20 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="w-full h-[100px] bg-white rounded-2xl p-3 animate-pulse"></div>
          <div className="w-full h-[100px] bg-white rounded-2xl p-3 animate-pulse"></div>
          <div className="w-full h-[100px] bg-white rounded-2xl p-3 animate-pulse"></div>
        </div>
      </main>
    </div>
  );
}
