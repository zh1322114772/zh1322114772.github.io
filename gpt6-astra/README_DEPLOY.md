# GitHub Pages deployment

This folder is a static deployment bundle. It does not need Node.js, Blender, or a build step.

## Deploy

1. Upload the contents of this folder to a GitHub repository.
2. In GitHub, open **Settings -> Pages**.
3. Select **Deploy from a branch**.
4. Select the branch and the `/ (root)` folder, then save.
5. Open the generated Pages URL.

## Pages

- `index.html`: main house viewer
- `village.html`: village viewer
- `detail_review.html`: detail review gallery

The viewer uses relative paths, so it works both at a repository subpath and at a custom domain. `node_modules/three` is included because GitHub Pages serves these ES modules as static files.

For lower memory usage, open `village.html?quality=web`. The default village page uses the normal web GLB assets included in this bundle.

The Blender source files and generation scripts are intentionally excluded from this deployment bundle.
