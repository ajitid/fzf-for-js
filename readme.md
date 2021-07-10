# fzf for JavaScript

<img src="assets/landing.gif" />

## Install

```sh
npm i fzf
```

## Usage

```js
import { fzf } from 'fzf'

const list = ["java", "javascript", "python", "rust", "swift", "go"]

const results = fzf(list, "jav")
console.log("ranking is:")
results.forEach(entry => console.log(entry.item))
```

## Why?

Most of the apps now have a command palette now. It allows you to quickly
search for a term you want, without typing the whole words out. It is
ubiquitous – you can find it in code editors (Sublime Text, VS Code), design
tools (Figma), CLI (fzf), source control tools (Sublime Merge, Fork), project
management apps (Height, Linear). Commands are easier to remember than their
keyboard shortcuts, natural to type in and promotes discoverability and easier
to find items than in menu list. Partial term matching coupled with
discoverability gives user the users a feeling that they are power users (and
it really delivers on it). Web app are becoming quite common interfaces and
hence a great search experience is needed. It delivers the search experience
that you've grown to know and love in VS Code (link which says VS Code uses fzf).
https://capiche.com/e/consumer-dev-tools-command-palette
https://outline.com/ftz8qm


