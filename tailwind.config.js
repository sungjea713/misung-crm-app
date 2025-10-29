/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,tsx,ts,jsx,js}",
  ],
  theme: {
    extend: {
      colors: {
        // 다크 배경 (이미지 기반)
        'bg-dark': '#1a1a1a',
        'bg-darker': '#0f0f0f',
        'bg-card': '#2d2d2d',

        // 그린 색상 (로그인 버튼)
        'primary': '#4ade80',
        'primary-dark': '#22c55e',
        'primary-hover': '#3bc96a',

        // 회색 톤
        'gray-border': '#3d3d3d',
        'gray-input': '#333333',
        'gray-text': '#9ca3af',
        'gray-text-light': '#6b7280',

        // 텍스트
        'text-primary': '#ffffff',
        'text-secondary': '#d1d5db',
      },
    },
  },
  plugins: [],
}
