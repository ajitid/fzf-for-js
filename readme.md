# [WIP] FZF for JavaScript

[![CI](https://github.com/ajitid/fzf-for-js/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/ajitid/fzf-for-js/actions/workflows/main.yml)
![Vercel](https://ajitid-vercel-badge.vercel.app/api/ajitid/fzf-for-js)

<img src="assets/landing.gif" />

## Install

```sh
npm i fzf
```

## Usage

```js
import { Fzf } from 'fzf'

const list = ['go', 'javascript', 'python', 'rust', 
              'swift', 'kotlin', 'elixir', 'java', 
              'lisp', 'v', 'zig', 'nim', 'rescript', 
              'd', 'haskell']

const fzf = new Fzf(list)
const entries = fzf.find('li')
console.log('ranking is:')
results.forEach(entry => console.log(entry.item)) // lisp kotlin elixir
```

