# PM README

pm - project manager

```
RootFolder
  - vue
     - project 1
     - project 2
  - react
     - project 1
     - project 2
```

## Features

- new project `√`
- open project `√`
- delete project `√`
- quick opening project `√`
- multi project in a workspace `×`
- recently used `×`
- remove dependencies `×`

## Extension Settings

```json
{
  "ProjectManager.root": "D:\\Projects",
  "ProjectManager.category": "Vue,React,Node,Python,Rust,Go,PHP,Java,Lua,RemoteRepository,Temp"
}
```

## Known Issues

1. [excute command in terminal]
   there are problems with different shell,i use the `pwsh`, it can use the `&&` excute command.

## Release Notes

### 0.0.1

Initial release;

- new,delete,open `√`

### 0.1.0

- optimize open and delete project

- change scaffolds to configurable

### 0.1.1

- new feature: quick opening project

- fix : it is not work that excute command in terminal when it is used

---

**Enjoy!**
