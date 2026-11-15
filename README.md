
## 1. Scope and Technical Overview

This document describes the frontend architecture, cartographic rendering pipeline, geodetic computation models, astronomical simulation methods, and scientific assumptions implemented in NAVLUNAR.

It serves as the technical reference for the client-side application.

The scope is restricted to:

- Frontend architecture and component responsibilities.
- Geodetic reference systems and coordinate transformations.
- Map projections and cartographic rendering.
- Lunar Grid Reference System (LGRS) implementation.
- Solar geometry and illumination simulation.
- WMTS integration and raster composition.
- Three-dimensional planetary visualization.
- Spatial analysis and cell-level computation.
- Numerical assumptions, precision constraints, and known limitations.

General project information, mission objectives, organizational context, and deployment documentation are maintained separately in the repository's project-level documentation.

---

# 2. Frontend Architecture

## 2.1. Technology Stack

The frontend is implemented using the following technologies:

| Technology | Responsibility |
|---|---|
| Next.js 15 | Application framework and routing |
| React | Component architecture and UI state management |
| TypeScript | Static typing and scientific data structures |
| React Leaflet | Interactive 2D cartographic rendering |
| Leaflet | Map interaction and layer management |
| Proj4 | Coordinate transformation engine |
| Proj4Leaflet | Integration of custom projections with Leaflet |
| Three.js | Three-dimensional lunar visualization |
| Canvas 2D API | Raster texture composition |
| Tailwind CSS | Utility-based styling |
| shadcn/ui | Interface components |

The application follows a modular client-side architecture in which geospatial calculations, cartographic rendering, astronomical simulation, and user interface components are treated as separate responsibilities.

## 2.2. Application Architecture

The frontend is conceptually divided into five functional subsystems.

### Cartographic Engine

Responsible for:

- Projection registration.
- Geographic coordinate transformations.
- Map initialization.
- Raster tile rendering.
- Layer visibility and opacity.
- Coordinate interaction.

### Geospatial Computation Engine

Responsible for:

- LGRS cell identification.
- Geographic boundary resolution.
- Coordinate-to-grid transformations.
- Spatial containment tests.
- Geographic proximity calculations.

### Astronomical Simulation Engine

Responsible for:

- Solar position estimation.
- Solar elevation and azimuth calculations.
- Illumination geometry.
- Terminator generation.
- Earth visibility approximation.
- Time-dependent simulation state.

### Three-Dimensional Rendering Engine

Responsible for:

- Spherical geometry.
- Lunar surface texture generation.
- Raster texture mapping.
- Solar illumination.
- Camera positioning and interaction.

### Application Interface

Responsible for:

- Navigation.
- Cell inspection.
- Layer controls.
- Projection selection.
- Simulation controls.
- Scientific telemetry presentation.

The separation of these subsystems minimizes coupling between numerical computation and visual presentation.

Scientific calculations should remain independent of React rendering cycles whenever possible. Components should consume computed results rather than implement geodetic or astronomical algorithms directly.

## 2.3. Client-Side Rendering Considerations

Leaflet and Three.js require browser APIs, including DOM elements, WebGL contexts, and Canvas interfaces.

Consequently, browser-dependent components must be initialized on the client.

The implementation must avoid executing browser-specific operations during server-side rendering.

Recommended boundaries include:

- Client components for interactive maps.
- Client components for Three.js scenes.
- Isolated calculation modules for coordinate transformations and astronomical geometry.
- Explicit initialization and cleanup of rendering resources.

Three.js resources, animation loops, event listeners, and WebGL contexts must be properly disposed of when their associated components unmount.

---

# 3. Geodetic Reference System

## 3.1. Reference Datum

NAVLUNAR uses the lunar reference system:

`IAU_Moon_2000`

The reference mean lunar radius is defined as:

$$
R_{\text{Moon}} = 1,737,400 \text{ m}
$$

This value is used as the reference radius for spherical coordinate transformations and geometric calculations.

The corresponding mean circumference is:

$$
C = 2\pi R_{\text{Moon}}
$$

$$
C \approx 10,916,000 \text{ m}
$$

The spherical model provides a consistent mathematical framework for:

- Geographic coordinate conversion.
- Surface distance estimation.
- Polar projection.
- Solar illumination geometry.
- Three-dimensional globe construction.

### Scientific Assumption: Spherical Lunar Approximation

The reference model assumes a spherical Moon with a constant mean radius.

This is a simplification of the actual lunar figure, which contains topographic variations and deviations from a perfect sphere.

The spherical approximation is appropriate for general cartographic visualization and preliminary geometric analysis.

It should not be interpreted as a high-precision lunar geodetic solution.

In particular, local elevation measurements are not automatically incorporated into the reference sphere.

---

# 4. Cartographic Projection Engine

## 4.1. Projection Strategy

NAVLUNAR implements three cartographic configurations through Proj4 and Proj4Leaflet.

The selection of projection depends on the geographic region being visualized.

This approach avoids relying on a single projection for the entire lunar surface, particularly in regions where cylindrical projections introduce substantial geometric distortion.

| Projection | Intended Region | Primary Application |
|---|---|---|
| Equidistant Cylindrical | Global, approximately ±60° latitude | General navigation |
| North Polar Stereographic | Northern polar region | Northern high-latitude analysis |
| South Polar Stereographic | Southern polar region | Southern high-latitude analysis |

## 4.2. Equidistant Cylindrical Projection

The global cartographic view uses the Equidistant Cylindrical projection, commonly referred to as Plate Carrée.

Its mathematical transformation is:

$$
x = R\lambda
$$

$$
y = R\varphi
$$

Where:

- $R$ is the reference lunar radius.
- $\lambda$ is longitude in radians.
- $\varphi$ is latitude in radians.

The inverse transformation is:

$$
\lambda = \frac{x}{R}
$$

$$
\varphi = \frac{y}{R}
$$

Longitude and latitude are angular coordinates, whereas $x$ and $y$ are projected linear coordinates.

The projection preserves angular coordinate spacing but does not preserve area, shape, or distance globally.

### Implementation Assumptions

- Longitude is represented consistently in the selected angular convention.
- Latitude is restricted to its valid geographic range.
- The global view is optimized for navigation rather than precise metric measurement.
- High-latitude regions should be visualized using polar projections.

A practical latitude limit of approximately ±60° is used as the transition threshold between global and polar cartographic modes.

This threshold is an application-level design decision, not a mathematical singularity of the projection.

## 4.3. Polar Stereographic Projections

The polar views use stereographic projections centered on the lunar poles.

The projection is conformal and particularly suitable for visualizing high-latitude regions.

For a spherical body, the polar stereographic radial coordinate can be expressed as:

$$
\rho = 2R\tan\left(\frac{\pi}{4}-\frac{|\varphi|}{2}\right)
$$

Where:

- $R$ is the lunar reference radius.
- $\varphi$ is the absolute latitude.
- $\rho$ is the distance from the projection center.

For the northern hemisphere:

$$
x = \rho\sin(\lambda-\lambda_0)
$$

$$
y = -\rho\cos(\lambda-\lambda_0)
$$

For the southern hemisphere, the vertical orientation is reversed according to the selected projection convention.

Here, $\lambda_0$ represents the central meridian.

### Projection Properties

Polar stereographic projection provides:

- Preservation of local angles.
- Improved visual representation of polar morphology.
- Reduced directional distortion around the projection center.
- A suitable framework for polar terrain analysis.

However, it does not preserve area or distance.

Metric measurements performed in projected coordinates must account for the projection scale factor.

### Polar Region Considerations

Polar regions are particularly relevant for the analysis of Permanently Shadowed Regions (PSRs).

The application therefore treats polar projection as a specialized visualization mode rather than a simple zoomed version of the global map.

---

# 5. Lunar Grid Reference System (LGRS)

## 5.1. Purpose

The Lunar Grid Reference System provides a discrete spatial indexing mechanism for the lunar surface.

Its purpose is to convert continuous geographic coordinates into stable identifiers that can be used for:

- Geographic navigation.
- Cell-based analysis.
- Dynamic route references.
- Individual cell inspection.
- Spatial data association.
- URL-based navigation.

The implemented reference format is:

```text
[BAND]-[SECTOR]-E[EASTING]-N[NORTHING]
```

Example:

```text
K-12-EXXXXX-NYYYYY
```

The example illustrates the structural format only.

## 5.2. Longitude Sectorization

The lunar surface is divided into 24 longitudinal sectors.

Each sector covers:

$$
\Delta\lambda = \frac{360^\circ}{24}
$$

$$
\Delta\lambda = 15^\circ
$$

For a longitude normalized to the interval:

$$
\lambda \in [0^\circ,360^\circ)
$$

The sector index is:

$$
S = \left\lfloor\frac{\lambda}{15^\circ}\right\rfloor + 1
$$

This produces sector identifiers ranging from 1 to 24.

The implementation must define a consistent longitude normalization convention before sector assignment.

For example, longitudes represented in the interval $[-180^\circ,180^\circ)$ must be normalized before applying the sector formula.

## 5.3. Latitude Band Classification

Latitude bands provide the second level of spatial partitioning.

The documented LGRS specification identifies alphabetic band labels ranging from H to Q.

However, the stated specification also describes seven latitudinal divisions.

These two definitions are not equivalent: the inclusive alphabetical range H–Q contains ten letters.

Therefore, the exact band boundaries and the mapping between latitude intervals and alphabetic identifiers must be treated as configuration-dependent until the authoritative LGRS V2.1 definition is established.

The frontend must not infer the missing band boundaries from the alphabetic labels alone.

The recommended implementation is to maintain a centralized band-definition table containing:

- Band identifier.
- Minimum latitude.
- Maximum latitude.
- Hemisphere.
- Boundary inclusion convention.

A single authoritative configuration must be shared by coordinate classification, cell generation, and cell validation.

## 5.4. Metric Grid Coordinates

The LGRS reference format includes Easting and Northing coordinates.

These represent metric spatial coordinates rather than angular longitude and latitude.

A fundamental implementation requirement is to distinguish:

- Geographic coordinates: latitude and longitude.
- Projected coordinates: Easting and Northing.
- Grid identifiers: discrete cell references.

Easting and Northing must be calculated using the specified LGRS projection and grid origin.

They must not be obtained by simply multiplying longitude and latitude by the lunar radius unless the intended projection explicitly defines that transformation.

## 5.5. Resolution and Precision

The LGRS specification describes a maximum nominal resolution of 1 metre.

This represents an identifier or grid resolution, not necessarily the actual positional accuracy of the frontend.

Actual positional accuracy depends on:

- The underlying coordinate reference system.
- Projection distortion.
- Source raster resolution.
- Numerical precision.
- Datum realization.
- Geographic transformation accuracy.

Consequently, a 1-metre grid reference must not be interpreted as proof of 1-metre geospatial accuracy.

## 5.6. Coordinate-to-Cell Resolution

The cell resolution process follows this conceptual sequence:

1. Receive geographic coordinates.
2. Normalize longitude.
3. Validate latitude.
4. Determine the applicable latitude band.
5. Determine the longitudinal sector.
6. Transform geographic coordinates into the corresponding metric grid.
7. Calculate Easting and Northing.
8. Encode the resulting reference.
9. Validate the generated identifier.

The inverse process must decode the identifier and recover its geographic cell boundaries using the same configuration.

Forward and inverse transformations should be tested for consistency.

---

# 6. Astronomical Computation Engine

## 6.1. Temporal Reference

The astronomical simulation uses J2000.0 as its reference epoch.

J2000.0 corresponds to:

$$
JD = 2451545.0
$$

The simulation must distinguish between:

- Absolute astronomical time.
- Simulation time.
- Lunar illumination phase.
- Geographic position on the lunar surface.

The temporal state is an input to the astronomical computation engine.

All time-dependent visual components should consume the same simulation timestamp to prevent inconsistencies between the terminator, globe shading, and cell telemetry.

## 6.2. Synodic Month

The lunar illumination cycle is approximated using the mean synodic month:

$$
T_{\text{syn}} = 29.53 \text{ days}
$$

The normalized phase is:

$$
f(t)=\operatorname{mod}
\left(
\frac{t-t_0}{T_{\text{syn}}},1
\right)
$$

Where:

- $t$ is the current simulation time.
- $t_0$ is the reference phase epoch.
- $T_{\text{syn}}$ is the mean synodic period.

The phase can be mapped into an angular representation:

$$
\theta(t)=2\pi f(t)
$$

This provides a simplified periodic model for lunar illumination.

### Scientific Assumption

A constant synodic period is used instead of a full high-precision lunar ephemeris.

The model does not automatically account for all perturbations affecting the actual Sun-Moon-Earth configuration.

It is therefore suitable for visualization and educational simulation, not precision astronomical prediction.

## 6.3. Solar Position

The Sun's position must be represented in a coordinate system compatible with the lunar surface geometry.

For a spherical Moon, a surface point can be represented using a unit vector:

$$
\mathbf{p}=
\begin{bmatrix}
\cos\varphi\cos\lambda\\
\cos\varphi\sin\lambda\\
\sin\varphi
\end{bmatrix}
$$

Where:

- $\varphi$ is selenographic latitude.
- $\lambda$ is selenographic longitude.

The solar direction is represented by a normalized vector:

$$
\mathbf{s}=
\begin{bmatrix}
s_x\\
s_y\\
s_z
\end{bmatrix}
$$

The solar zenith angle is obtained from:

$$
\cos\theta_z = \mathbf{p}\cdot\mathbf{s}
$$

The solar elevation angle is:

$$
\alpha = \arcsin(\mathbf{p}\cdot\mathbf{s})
$$

Where:

- $\alpha > 0$: the Sun is geometrically above the local horizon.
- $\alpha = 0$: the Sun is on the geometric horizon.
- $\alpha < 0$: the point is geometrically unilluminated.

The solar azimuth can be calculated using local east and north basis vectors.

These vectors must be defined consistently with the selected selenographic longitude convention.

### Coordinate Frame Assumption

The surface normal is approximated by the radial vector of the spherical reference body.

For a spherical Moon:

$$
\mathbf{n}=\mathbf{p}
$$

This assumption does not account for local terrain slopes.

If terrain-aware solar illumination is required, the surface normal must instead be estimated from elevation data.

## 6.4. Lunar Obliquity

The simulation uses an approximate lunar orbital inclination or obliquity parameter of:

$$
\epsilon_{\text{Moon}}\approx1.54^\circ
$$

This value is treated as a simplified geometric parameter.

It must not be confused with the obliquity of the Earth's equator relative to the ecliptic.

The exact astronomical interpretation and reference frame of this parameter must remain consistent throughout the solar position calculation.

A complete astronomical model would require a more rigorous treatment of the lunar orbital plane, rotational axis, and time-dependent orientation.

## 6.5. Solar Terminator

The terminator represents the geometric boundary separating the illuminated and unilluminated hemispheres.

For a spherical body, the ideal geometric terminator satisfies:

$$
\mathbf{p}\cdot\mathbf{s}=0
$$

This defines a great circle on the lunar reference sphere.

The implementation samples the terminator using 360 angular positions.

The resulting points are transformed into geographic coordinates and used to construct a visual polyline.

### Sampling Assumptions

- The terminator is sampled at one-degree angular intervals.
- The reference geometry is spherical.
- Interpolation is performed along the corresponding geometric circle.
- The resulting polyline is intended for cartographic visualization.

The number of samples controls visual smoothness, not scientific accuracy.

A 360-point representation should not be confused with a full numerical integration of an astronomical orbit.

### Important Distinction

The geometric terminator and the observed illumination boundary are not necessarily identical.

Terrain relief, local slopes, atmospheric effects, and the finite angular diameter of the Sun may influence observed illumination.

NAVLUNAR uses the geometric approximation unless additional terrain-aware illumination models are explicitly implemented.

---

# 7. Earth Visibility and Libration

## 7.1. Earth Visibility Model

The application includes a simplified representation of Earth's apparent position from the lunar surface.

The Earth direction must be expressed in the same lunar reference frame used by the rest of the astronomical engine.

A normalized Earth direction vector can be represented as:

$$
\mathbf{e}=
\begin{bmatrix}
e_x\\
e_y\\
e_z
\end{bmatrix}
$$

This vector can be used to estimate the angular relationship between a surface position and the Earth.

## 7.2. Libration

Libration describes the apparent oscillation of the Moon as observed from Earth.

It results from orbital eccentricity, orbital inclination, and the relationship between orbital and rotational motion.

A simplified frontend simulation may approximate libration through time-dependent angular offsets:

$$
\lambda'(t)=\lambda+\Delta\lambda(t)
$$

$$
\varphi'(t)=\varphi+\Delta\varphi(t)
$$

Where:

- $\Delta\lambda(t)$ is the longitudinal libration approximation.
- $\Delta\varphi(t)$ is the latitudinal libration approximation.

These corrections are intended to reproduce qualitative apparent motion.

### Scientific Limitation

A periodic angular approximation is not equivalent to a complete lunar orientation model.

For physically accurate Earth visibility, the application would require a time-dependent lunar orientation solution, such as an appropriate IAU rotation model or a high-precision ephemeris.

The simplified model must therefore be treated as a visualization feature.

---

# 8. NASA Raster Data Integration

## 8.1. Data Access Architecture

The cartographic engine consumes raster products through WMTS-compatible tile services connected to NASA Trek infrastructure.

WMTS provides a standardized mechanism for requesting georeferenced raster tiles.

The frontend is responsible for:

- Configuring tile matrix sets.
- Selecting the appropriate layer.
- Mapping tile coordinates to the active projection.
- Managing zoom levels.
- Handling asynchronous tile loading.
- Rendering raster overlays.
- Managing tile opacity and visibility.

The rendering system must preserve the coordinate reference system and tiling scheme expected by each service.

A WMTS layer cannot be assumed to be compatible with every custom Leaflet projection.

The tile matrix set, coordinate reference system, tile origin, and scale levels must be validated against the service metadata.

## 8.2. Primary Raster Products

The frontend integrates the following categories of lunar raster products.

### LRO WAC Global Mosaic

Source: Lunar Reconnaissance Orbiter Wide Angle Camera.

Purpose:

- Global optical visualization.
- Surface morphology inspection.
- General lunar navigation.
- Visual context for geographic analysis.

The documented product resolution is approximately 303 pixels per degree.

This value is an angular sampling density and must not be confused with a constant linear resolution across all latitudes.

At the lunar equator, the approximate linear sampling distance is:

$$
d=\frac{\pi R}{180P}
$$

Where:

- $R$ is the lunar reference radius.
- $P$ is the pixel density in pixels per degree.

For 303 pixels per degree:

$$
d\approx100\text{ m/pixel}
$$

The effective ground resolution varies with latitude and the source product's projection.

### LOLA Color Shaded Relief

Source: Lunar Orbiter Laser Altimeter.

Purpose:

- Elevation visualization.
- Terrain morphology.
- Topographic context.
- Relief interpretation.

The frontend treats the raster as a visual representation of processed altimetry data.

A critical distinction must be maintained between:

1. Color-shaded relief images.
2. Actual numerical elevation datasets.

A colorized relief image is not, by itself, a metrically reliable elevation source.

If the application uses only a rendered shaded-relief product, numerical elevation, slope, and surface-normal calculations cannot be derived reliably from its RGB values.

Quantitative terrain calculations require the original elevation data or a documented encoding scheme.

### LROC Polar Mosaics

Source: Lunar Reconnaissance Orbiter Camera products.

Purpose:

- Polar surface visualization.
- High-latitude morphology.
- Local terrain inspection.
- Context for permanently shadowed regions.

The documented nominal resolution is approximately 100 metres per pixel.

This value must be verified against the specific raster product and zoom level being consumed.

The frontend should not assume that all polar tiles share identical spatial resolution.

## 8.3. Tile Rendering and Layer Management

Each raster layer should be configured independently.

Recommended layer metadata includes:

- Layer identifier.
- Source service.
- WMTS layer name.
- Tile matrix set.
- Coordinate reference system.
- Minimum zoom.
- Maximum zoom.
- Attribution.
- Visibility state.
- Opacity.
- Geographic coverage.

The application should avoid requesting unnecessary high-resolution tiles outside the active viewport.

Tile loading should remain asynchronous to prevent blocking the main rendering thread.

Network failures and missing tiles must not interrupt the rest of the interface.

---

# 9. Three-Dimensional Lunar Visualization

## 9.1. Globe Architecture

The `GlobeView` component implements a three-dimensional lunar representation using Three.js.

The visualization pipeline consists of:

1. Acquisition of raster tiles.
2. Raster decoding.
3. Canvas-based composition.
4. Texture generation.
5. Texture assignment to spherical geometry.
6. Solar illumination.
7. Camera interaction.

The spherical geometry uses the same reference lunar radius as the cartographic computation engine.

## 9.2. Texture Composition

The application uses the Canvas 2D API to combine multiple WMTS raster layers into a single texture.

The target texture dimensions are:

$$
W=2048,\qquad H=1024
$$

The resulting texture is mapped onto the lunar sphere.

For an equirectangular texture, the expected geographic mapping is:

$$
u=\frac{\lambda+180^\circ}{360^\circ}
$$

$$
v=\frac{90^\circ-\varphi}{180^\circ}
$$

Where:

- $u$ is the horizontal texture coordinate.
- $v$ is the vertical texture coordinate.
- $\lambda$ is longitude in degrees.
- $\varphi$ is latitude in degrees.

The texture coordinate convention must be consistent with the orientation of the Three.js sphere geometry.

### Texture Composition Assumptions

- The texture uses an equirectangular layout.
- The longitude range covers the full 360° surface.
- The latitude range covers both poles.
- Source raster tiles are transformed or positioned into the expected texture coordinate space.
- The texture is updated when the underlying raster composition changes.

The 2048 × 1024 texture provides a convenient rendering resolution but does not represent the native resolution of the source datasets.

It introduces an additional resampling stage.

## 9.3. Texture Resolution Limitations

The final visual detail is limited by the texture dimensions.

A 2048 × 1024 equirectangular texture contains approximately:

$$
2,097,152 \text{ pixels}
$$

Its approximate equatorial angular resolution is:

$$
\frac{360^\circ}{2048}
\approx0.176^\circ/\text{pixel}
$$

This corresponds to approximately:

$$
5.35\text{ km/pixel}
$$

at the lunar equator.

Consequently, the global globe texture is suitable for planetary-scale visualization but cannot reproduce the native detail of high-resolution LRO imagery.

A multi-resolution or tiled texture strategy would be required for detailed three-dimensional terrain inspection.

## 9.4. Solar Illumination in Three.js

The globe uses a directional lighting model to represent the solar illumination direction.

The normalized solar vector computed by the astronomical engine is passed to the rendering subsystem.

For a surface normal $\mathbf{n}$ and normalized light direction $\mathbf{l}$, the diffuse illumination term is:

$$
I_d=\max(0,\mathbf{n}\cdot\mathbf{l})
$$

The final rendered intensity may also include ambient and material contributions.

A simplified lighting model can be expressed as:

$$
I=I_a+k_dI_d
$$

Where:

- $I_a$ is ambient illumination.
- $k_d$ is the diffuse reflection coefficient.

The rendering engine must distinguish visual lighting from physically based radiometric simulation.

The purpose of the lighting model is to reproduce the global day-night boundary and its temporal evolution.

It does not constitute a complete lunar photometric model.

## 9.5. Rendering Performance

The following practices are recommended:

- Reuse geometries and materials.
- Avoid unnecessary texture regeneration.
- Limit Canvas redraw operations.
- Update solar lighting only when simulation state changes.
- Dispose of obsolete textures.
- Avoid creating multiple WebGL contexts.
- Use an appropriate device pixel ratio.
- Reduce rendering resolution on constrained devices.

The rendering pipeline should prioritize stable frame rates without compromising the correctness of the underlying coordinate transformations.

---

# 10. Cell-Level Scientific Analysis

## 10.1. Dynamic Cell Routes

Individual LGRS cells are exposed through the dynamic route:

```text
/cell/[code]
```

The route parameter identifies the geographic cell to be inspected.

The frontend must treat the route identifier as an external input and validate it before performing any spatial computation.

Validation includes:

- Identifier structure.
- Valid band.
- Valid sector.
- Numeric Easting and Northing values.
- Valid coordinate ranges.
- Consistency with the configured LGRS definition.

An invalid identifier must produce a controlled error state rather than an invalid geographic calculation.

## 10.2. Geographic Boundary Resolution

Each cell is resolved into geographic boundaries:

$$
B=
[\varphi_{\min},\varphi_{\max},
\lambda_{\min},\lambda_{\max}]
$$

The resulting boundaries define the geographic extent of the cell.

The calculation must account for the actual LGRS grid geometry.

A rectangular representation in projected coordinates does not necessarily correspond to a rectangular region in geographic coordinates.

Consequently, the four geographic bounds may be only an approximation of the actual projected cell boundary.

For accurate representation, the projected cell perimeter should be sampled and transformed into geographic coordinates.

## 10.3. Spatial Containment

A geographic point belongs to a cell if it falls within the cell's defined geographic or projected boundaries.

For an axis-aligned projected grid cell:

$$
E_{\min}\leq E\leq E_{\max}
$$

$$
N_{\min}\leq N\leq N_{\max}
$$

Geographic containment should be evaluated after transforming the point into the same reference system used by the cell definition.

Longitude wrapping and antimeridian crossings require explicit handling.

## 10.4. Proximity Analysis

The cell analysis interface includes spatial filtering of catalogued lunar features and mission-related locations.

Potential datasets include:

- NASA mission locations.
- Roscosmos mission locations.
- IAU crater catalogues.
- Other georeferenced lunar surface features.

The frontend performs spatial filtering using the geographic coordinates associated with the selected cell.

For a spherical reference body, the great-circle distance between two points can be calculated using the Haversine formula.

Given two points:

$$
(\varphi_1,\lambda_1),\quad
(\varphi_2,\lambda_2)
$$

Define:

$$
\Delta\varphi=\varphi_2-\varphi_1
$$

$$
\Delta\lambda=\lambda_2-\lambda_1
$$

Then:

$$
a=
\sin^2\left(\frac{\Delta\varphi}{2}\right)
+
\cos\varphi_1\cos\varphi_2
\sin^2\left(\frac{\Delta\lambda}{2}\right)
$$

The angular distance is:

$$
c=2\arctan2(\sqrt{a},\sqrt{1-a})
$$

The estimated surface distance is:

$$
d=Rc
$$

All angular inputs must be converted to radians.

### Proximity Assumptions

- The lunar reference body is spherical.
- Distances represent surface arc distances.
- Terrain elevation differences are ignored.
- Surface obstacles are not considered.
- The calculation does not establish physical accessibility.

Therefore, proximity analysis is geographic rather than operational.

## 10.5. Local Solar Telemetry

Each cell includes a solar telemetry calculation.

The representative point is defined as the geographic center of the cell.

For an approximately rectangular geographic extent:

$$
\varphi_c=
\frac{\varphi_{\min}+\varphi_{\max}}{2}
$$

$$
\lambda_c=
\frac{\lambda_{\min}+\lambda_{\max}}{2}
$$

However, when the cell is defined in projected coordinates, the preferred method is to calculate its projected centroid and transform that centroid into geographic coordinates.

This avoids introducing unnecessary errors when the projection is not locally linear.

The solar elevation is then calculated using the active astronomical simulation state.

The displayed telemetry should include:

- Cell identifier.
- Representative geographic coordinates.
- Simulation timestamp.
- Solar elevation.
- Solar azimuth, when available.
- Illumination classification.

The result represents illumination at the representative point, not the illumination state of the entire cell.

---

# 11. Numerical Precision and Computational Assumptions

## 11.1. Floating-Point Arithmetic

JavaScript numerical calculations use IEEE 754 double-precision floating-point numbers.

This provides approximately 15–16 significant decimal digits of precision.

However, numerical precision must not be confused with geospatial accuracy.

The precision of the final result is constrained by:

- Source dataset accuracy.
- Coordinate reference system accuracy.
- Projection distortion.
- Sampling resolution.
- Model simplifications.
- Floating-point arithmetic.

Displaying coordinates to several decimal places does not guarantee equivalent physical accuracy.

## 11.2. Angular Units

The frontend must establish an explicit convention for angular units.

Recommended internal conventions:

- Geographic interfaces: degrees.
- Trigonometric calculations: radians.
- Vector calculations: dimensionless normalized coordinates.

Conversions should be centralized.

$$
\theta_{\text{rad}}=
\theta_{\text{deg}}\frac{\pi}{180}
$$

Mixing degrees and radians is a critical source of geospatial and astronomical errors.

## 11.3. Longitude Normalization

Longitude normalization must be performed consistently.

A possible normalization function is:

$$
\lambda_{\text{norm}}
=
((\lambda+180)\bmod360)-180
$$

This maps longitude to:

$$
[-180^\circ,180^\circ)
$$

The application must use the same convention across:

- Map projections.
- LGRS sector assignment.
- Texture mapping.
- Spatial containment.
- Geographic distance calculations.

## 11.4. Numerical Stability

The frontend should protect calculations against invalid numerical inputs.

Examples include:

- Clamping dot products to the interval [-1, 1] before inverse trigonometric operations.
- Preventing division by zero.
- Validating coordinate ranges.
- Handling undefined values.
- Managing projection singularities.
- Normalizing vectors before angular calculations.

For example, solar elevation should use:

$$
\alpha=
\arcsin\left(
\operatorname{clamp}
(\mathbf{p}\cdot\mathbf{s},-1,1)
\right)
$$

This prevents floating-point rounding from producing invalid inverse trigonometric inputs.

---

# 12. State Synchronization

## 12.1. Shared Simulation State

The cartographic view, 3D globe, and cell analysis interface must consume a consistent simulation state.

The main shared parameters are:

- Simulation timestamp.
- Solar direction.
- Selected projection.
- Active raster layers.
- Selected LGRS cell.
- Geographic viewport.

The astronomical engine should calculate the solar state independently of the rendering components.

The resulting state is then distributed to the visual subsystems.

## 12.2. Time-Dependent Rendering

A change in simulation time may trigger:

1. Recalculation of solar direction.
2. Recalculation of terminator coordinates.
3. Updating of the 3D light source.
4. Recalculation of local solar telemetry.
5. Updating of Earth visibility, if enabled.

These operations should be synchronized to the same simulation timestamp.

Unnecessary recomputation should be avoided when only unrelated UI state changes.

---

# 13. Testing and Scientific Validation

The frontend requires both conventional software testing and scientific validation.

A visually correct interface does not necessarily imply mathematically correct geospatial results.

## 13.1. Geodetic Tests

Recommended tests:

- Coordinate normalization.
- Geographic-to-projected transformations.
- Inverse projection transformations.
- Polar projection behavior.
- Boundary conditions.
- Antimeridian handling.
- LGRS sector classification.
- Latitude band classification.
- Grid identifier round trips.

For coordinate transformations, the following invariant should hold within a defined numerical tolerance:

$$
T^{-1}(T(P))\approx P
$$

Where $T$ is the forward coordinate transformation.

## 13.2. Astronomical Tests

Recommended tests:

- Solar vector normalization.
- Solar elevation at known geometric configurations.
- Day-night classification.
- Terminator orthogonality.
- Temporal phase periodicity.
- Consistency between map and globe illumination.
- Correct handling of simulation timestamps.

For every terminator point:

$$
|\mathbf{p}\cdot\mathbf{s}|\approx0
$$

The numerical tolerance should be established according to the sampling and implementation method.

## 13.3. Rendering Tests

Recommended tests:

- Texture orientation.
- Longitude alignment.
- Polar texture behavior.
- Tile loading failures.
- Layer switching.
- Projection transitions.
- Globe lighting synchronization.
- Resource cleanup.
- Responsive rendering.

## 13.4. Cell Analysis Tests

Recommended tests:

- Valid cell decoding.
- Invalid identifier rejection.
- Cell boundary resolution.
- Geographic containment.
- Great-circle distance calculations.
- Cell centroid calculations.
- Local solar telemetry consistency.

## 13.5. Reference Validation

Where possible, calculated outputs should be compared against authoritative reference products.

Potential validation references include:

- NASA planetary cartographic documentation.
- IAU Working Group on Cartographic Coordinates and Rotational Elements.
- USGS Astrogeology coordinate system documentation.
- NASA SPICE geometry and ephemeris products.
- Published LRO and LOLA product metadata.

Reference comparisons should record the coordinate frame, epoch, units, and expected numerical tolerance.

---

# 14. Known Scientific Limitations

The current frontend architecture uses simplified geometric and numerical models.

The following limitations must be considered when interpreting its outputs.

| Subsystem | Current Assumption | Scientific Limitation |
|---|---|---|
| Lunar shape | Mean-radius sphere | Ignores local topography and body irregularities |
| Global projection | Plate Carrée | Distorts area and distance |
| Polar projection | Spherical stereographic | Does not provide true metric distances |
| LGRS | Configured grid partition | Requires authoritative band definitions and grid parameters |
| Grid resolution | Nominal 1 m | Does not imply 1 m positional accuracy |
| Solar simulation | Simplified periodic model | Not a high-precision ephemeris |
| Lunar orientation | Simplified libration | Not a complete rotation model |
| Terminator | Geometric great circle | Ignores terrain-induced shadowing |
| Surface normal | Radial vector | Ignores local slopes |
| Raster imagery | Resampled source tiles | Resolution depends on the final texture |
| Globe texture | 2048 × 1024 | Limited global spatial detail |
| Proximity analysis | Spherical distance | Ignores terrain and accessibility |
| Cell telemetry | Representative point | Does not characterize the entire cell |

These limitations are intrinsic to the selected simplified models and should be distinguished from implementation defects.

---

# 16. Final Scientific Considerations

NAVLUNAR's frontend combines cartographic transformations, raster visualization, spherical geometry, and simplified astronomical computation within a unified interactive environment.

The main engineering principle is the separation of three distinct concepts.

### Geometric Correctness

The mathematical consistency of coordinate transformations, spatial relationships, and vector calculations.

### Data Fidelity

The resolution, accuracy, coordinate reference system, and provenance of the underlying lunar datasets.

### Visual Fidelity

The ability of the interface to represent geographic and astronomical information clearly and consistently.

These three properties are related but are not interchangeable.

A high-resolution raster does not guarantee accurate geographic positioning. A precise coordinate transformation does not compensate for an inaccurate source dataset. A visually convincing illumination model does not establish astronomical accuracy.

For this reason, NAVLUNAR should be understood as a scientific geospatial visualization and analysis prototype.

Its outputs are intended for exploration, comparative analysis, and educational purposes.

**The current geometric and astronomical models must not be used as operational inputs for real lunar landing guidance, mission-critical navigation, hazard avoidance, or spacecraft trajectory determination.**

