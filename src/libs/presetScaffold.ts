export enum Scaffolds {
  vite = "npx create-vite template && mv .\\template\\* .\\",
  createElectronVite = "npx create-electron-vite template && mv .\\template\\* .\\",
  createReactApp = "npx create-react-app template && mv .\\template\\* .\\",
  createNextApp = "npx create-next-app@latest template && mv .\\template\\* .\\",
  createViteExtra = "npx create-vite-extra template && mv .\\template\\* .\\",
  cargoInit = "cargo new template",
}
