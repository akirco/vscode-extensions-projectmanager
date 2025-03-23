# pm - Project manager

```
RootFolder
  - vue
     - project 1
     - project 2
  - react
     - project 1
     - project 2
  - workspaces (default)
     - 2025-03-11-xxx.code-workspace
     - 2025-03-11-xyx.code-workspace
```

## Features

- new project `√`
- open project `√`
- delete project `√`
- quick opening project `√`
- multi project in a workspace `√`
- recently used `×`
- remove dependencies , only support `node_modules,rust target dir` `√`
- clone remote repository,not vsode default `git.clone` `√`

## Extension Settings

```json
{
  "window.dialogStyle": "custom", //Recommend settings
  "ProjectManager.root": "D:\\Projects",// linux /home/username/Projects
  "ProjectManager.category": "Vue,React,Node,Python,Rust,Go,PHP,Java,Lua,RemoteRepository,Temp"
}
```


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

### 0.1.3

- linux supported

### 0.1.5
 - change create project logic
 - change excute command logic
 - add clone repository command
 - add open folder as a workspace
 - add remove dependencies command, only support `node_modules,rust target dir` , current is not support config

---

**Enjoy!**
