import nativewind from 'nativewind/preset';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../screens/**/*.{js,jsx,ts,tsx}",
    "../components/**/*.{js,jsx,ts,tsx}",
    "../navigation/**/*.{js,jsx,ts,tsx}",
    "../context/**/*.{js,jsx,ts,tsx}",
    "../data/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [nativewind],
  theme: {
    extend: {},
  },
  plugins: [],
}
