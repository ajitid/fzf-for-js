# [WIP] fzf for JavaScript

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

