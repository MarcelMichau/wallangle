<h1 align="center">
  wallangle
</h1>

<p align="center">
A CLI utility to set algorithmically generated triangle art as your desktop wallpaper/background.
</p>

---

Uses the awesome [Trianglify](https://github.com/qrohlf/trianglify) to randomly generate a low-poly desktop wallpaper:

![Preview Image](images/example.png 'Preview Image')

## Install

Requires [Node.js](https://nodejs.org/) >= 14.

```
$ npm install -g wallangle
```

## Usage

---

### Defaults

```
$ wallangle
```

### With Config

```
$ wallangle --width=2560 --height=1440 --variance=0.34 --cellSize=150
```

## Flags

### --width

Resolution width of your display.

### --height

Resolution height of your display.

### --variance

Decimal value between 0 and 1 (inclusive), defaults to `Math.random()`. Specify the amount of randomness used when generating triangles.

### --cellSize

Integer, defaults to `Math.random() * 200 + 40`. Specify the size of the mesh used to generate triangles. Larger values will result in coarser patterns, smaller values will result in finer patterns. Note that very small values may dramatically increase the runtime of Trianglify.

## Libraries Used

- [Trianglify](https://github.com/qrohlf/trianglify)
- [wallpaper](https://github.com/sindresorhus/wallpaper)
- [minimist](https://github.com/substack/minimist)
