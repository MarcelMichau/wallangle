<h1 align="center">
  wallangle
</h1>

<p align="center">
A CLI utility to set algorithmically generated triangle art as your desktop wallpaper/background.
</p>

---

Randomly generates a low-poly triangle art wallpaper for each of your monitors, at each monitor's native resolution:

![Preview Image](images/example.png 'Preview Image')

## Install

Requires [Node.js](https://nodejs.org/) >= 22.2, on Windows 10+ or macOS.

```
$ npm install -g wallangle
```

## Usage

### Defaults

```
$ wallangle
```

Every run prints the seed it used. Pass it back with `--seed` to recreate the same wallpapers.

### With Config

```
$ wallangle --variance=0.75 --cellSize=250 --seed=helloworld --colors="#083d77,#ebebd3,#da4167,#f4d35e,#f78764"
```

## Flags

Flags apply to every monitor. Anything left unset is chosen randomly for each monitor, derived from the seed.

### --width / --height

Image size in pixels. Defaults to each monitor's resolution, so you normally won't need these.

### --variance

Decimal value between 0 and 1 (inclusive). Specify the amount of randomness used when generating triangles. 0 gives a regular grid.

### --cellSize

Integer, at least 10. Defaults to a random value between 40 and 239. Specify the size of the mesh used to generate triangles. Larger values will result in coarser patterns, smaller values will result in finer patterns.

### --seed

Any string or number. Seeds the random number generator to create repeatable patterns. Defaults to a random seed.

### --colors

One of:

- A comma-separated list of CSS colours, e.g. `--colors="#083d77,#ebebd3,#da4167,#f4d35e,#f78764"`. You can use a tool such as [Coolors](https://coolors.co/) to generate palettes.
- The name of a sequential or diverging [ColorBrewer](https://colorbrewer2.org/) palette, e.g. `--colors=YlGnBu` or `--colors=Spectral`.
- `random` (the default), which picks a ColorBrewer palette.

## Where wallpapers are stored

- Windows: `%LOCALAPPDATA%\wallangle`
- macOS: `~/Library/Application Support/wallangle`

Each run writes new files and removes the previous run's files. On macOS, the wallpaper is set for the current Space on each display.

## Libraries Used

- [delaunator](https://github.com/mapbox/delaunator) for triangulation
- [chroma.js](https://github.com/gka/chroma.js) for colour scales and ColorBrewer palettes

Inspired by the awesome [Trianglify](https://github.com/qrohlf/trianglify).
