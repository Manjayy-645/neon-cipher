import type { Config } from "tailwindcss";
import { tokens } from "@neon-cipher/tokens";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: tokens,
  },
  plugins: [],
};
export default config;
