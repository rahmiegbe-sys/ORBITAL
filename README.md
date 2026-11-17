# ORBITAL

**An interactive 2D Newtonian N-body gravity simulator**, built from first principles with React, TypeScript and HTML5 Canvas.

ORBITAL simulates how stars and planets move under their mutual gravity. The physics runs in two dimensions; the bodies are rendered with 3D-style shading (limb-darkened stars, planets lit by their nearest star), so it reads like a window into space while staying an honest numerical model.

> Live demo: _coming soon_

---

## Why I built it

ORBITAL shows how celestial bodies interact through gravitational forces. Each body's acceleration depends on where every other body is at that moment, so its velocity and position change continuously with time. There is no simple formula for where three bodies will be in a hundred years — so instead we use calculus to *step* the motion forward through time, a little at a time, and build the answer numerically.

What still amazes me is that a differential equation can tell us so much — enough to predict an orbit, check our own accuracy and build further equations from it — without us ever writing down its exact solution.

## The physics

ORBITAL uses Newton's Law of Universal Gravitation which states:

$$\mathbf a_i = \sum_{j \ne i} G\, m_j \,\frac{\mathbf r_j - \mathbf r_i}{|\mathbf r_j - \mathbf r_i|^3}$$

r_j - r_i is the vector from body i to body j. Its length is the distance between the centres of the bodies, but here we treat them as point masses according to Newton's shell theorem. The acceleration is in the correct direction because each body is pulled towards the other body, meaning for body i the acceleration points from i to j. The denominator is |r| cubed because we multiply the unit vector of r by 1/r².

The j != i means we do not include the body itself. When calculating the acceleration of body i we are summing the accelerations caused by all other bodies except itself. A body cannot exert a force upon itself and including this would make both the numerator (r_i - r_i) and the denominator zero, giving 0/0.

Taking all bodies as point masses is realistic due to Newton's shell theorem. Any planets or stars can be treated as a point mass in space. Any spherical object will attract an external mass with the same force as if the entire mass was concentrated at the centre. This holds for both hollow spheres and solid spheres with the same mass, but will only be accurate if the object is spherically symmetrical and the mass is external. Real stars will have some bulge around their equator due to their rotation, so this is very accurate but not completely accurate.

As G = 1, M = 1 and r = 1 AU, 2π is the time taken for Earth to make one orbit around the Sun. v = 1 so period = 2π/1.

Epsilon stops us getting NaN when d = 0. The constant ensures there is no massive leap in acceleration when the bodies are close together. In reality gravity will become massive over small distances. However the simulator uses a constant time step of Δt. This means that if two bodies get very close together, one time step will cause a massive leap in one of the bodies. Softening avoids this ridiculous situation by reducing the gravity slightly at very small distances. This is a modelling choice as it sacrifices some accuracy at small distances for a stable simulation. Presets do not have any softening as they will not collide anyway. They are far enough away so it is not needed.

ORBITAL does not simulate 3D movement, Einstein's relativity, collisions/merging, tidal forces or actual sizes and shapes of bodies. It is not a planetary or system model. It simply shows how gravity affects objects over time.

## The numerical method

The formula gives the acceleration, but the simulator needs positions. Two equations connect them:

$$\frac{d\mathbf r}{dt} = \mathbf v \qquad \frac{d\mathbf v}{dt} = \mathbf a(\mathbf r)$$

The equations show that the rate of change (derivative) of position is velocity and the rate of change of velocity is acceleration. Most three-body problems are chaotic in nature. Although a few have solutions like the figure-eight modelled here, Bruns and Poincaré proved in the 1880s and 1890s that no general formula exists to predict the position of the bodies over time. So the simulator moves the bodies forward in small time steps Δt.

### Euler's method

$$\mathbf r_{new} = \mathbf r + \mathbf v\,\Delta t \qquad \mathbf v_{new} = \mathbf v + \mathbf a\,\Delta t$$

Euler's method calculates the velocity and acceleration at the start of each step and then uses those same values for the whole step. During the step the real velocity and acceleration keep changing, but Euler ignores this, which causes so much error.

The extra energy accumulates over time. This is because the velocity at the start of the step is used for the whole step, so the body moves in a straight line in the old direction and drifts off the curve. On a circle of radius 1 a straight step of 0.01 lands at a distance of about 1.00005 from the centre, slightly outside the circle. Every step lands outside and never inside, so the errors add up instead of cancelling.

### Velocity Verlet

$$\mathbf v_{1/2} = \mathbf v + \mathbf a(\mathbf r)\,\frac{\Delta t}{2} \qquad \mathbf r_{new} = \mathbf r + \mathbf v_{1/2}\,\Delta t \qquad \mathbf v_{new} = \mathbf v_{1/2} + \mathbf a(\mathbf r_{new})\,\frac{\Delta t}{2}$$

Lines 10 to 20 of `integrator.ts` do one Verlet step. First a new velocity is found by adding half a step of acceleration to the original v. This half velocity is used to calculate the new position. The acceleration is then calculated again at the new position, and the second half is added to get the final velocity. So each step uses the acceleration at both the start and the end of the step instead of only the start like Euler. Halving Δt reduces Euler's error by half, Verlet's by a fourth and RK4's by a sixteenth.

As a symplectic integrator Verlet keeps the total energy oscillating within a small band over time, preventing secular drift.

RK4 may be more accurate per step but it is not symplectic. Its energy error is very small but it slowly grows in one direction, so over centuries of simulated time the drift adds up. It is also less efficient because it needs four force calculations per step while ORBITAL's Verlet needs two. For long runs, keeping the energy error bounded matters more than getting a better approximation each step.

### The evidence

Both methods were run on the same circular orbit (Sun of mass 1, planet at distance 1, Δt = 0.01) for 10 orbits:

| Method | Largest energy error during the run | Energy error at the end | Final radius (should be 1) |
|---|---|---|---|
| Euler | 40.6% | 40.6% | 1.648 |
| Velocity Verlet | 2.4 × 10⁻⁹ | 1.1 × 10⁻¹⁵ | 1.0000000001 |

Euler's largest error is its final error because the error only ever grew. Verlet's error rose during each orbit and came back down, which is the bounded band in action.

These numbers come from `src/physics/euler.test.ts`. To reproduce them run:

```bash
npx vitest run src/physics/euler.test.ts --silent=false
```

## How I know it's correct

Passing tests don't automatically prove the physics is right, so the tests compare the simulation against things physics already tells us:

| Test | What it checks |
|---|---|
| Two-body acceleration | Matches my hand calculation (a₁ = (0.048, 0.064)) to 10 decimal places |
| Newton's third law | m₁a₁ + m₂a₂ = 0 |
| Softening | Overlapping bodies give finite numbers, not NaN |
| Energy conservation | Relative energy error < 10⁻⁶ after 10 orbits |
| Orbital period | A circular orbit returns to its start after exactly 2π |
| Binary star | Two equal stars stay exactly 1 AU apart |
| Figure-eight | Three stars return to their starting positions after the published period (T ≈ 6.3259) |
| Momentum | Every preset starts at zero total momentum and stays there |
| Time warp | Big time jumps are split into steps that cover the time exactly |

The app also shows **energy drift** and **momentum drift** live, so the accuracy is visible while it runs — not just claimed.

## Features

- **Presets:** Sun and Earth (real mass ratio), binary star, and the Chenciner–Montgomery figure-eight three-body orbit (2000)
- **Time warp** from 1 day/s to 1 century/s, with an elapsed-time clock in days, months, years and centuries
- **Honest accuracy readout:** at extreme speeds the computer can't keep Δt small, so the *Precision* indicator and energy drift show the trade-off between speed and accuracy
- Fading orbit trails, play / pause / reset, and a layout that works on phones

## Project structure

```
src/
├─ physics/     pure maths and physics — no drawing code, fully tested
│  ├─ vec2.ts         2D vector operations
│  ├─ gravity.ts      pairwise gravitational acceleration (+ softening)
│  ├─ integrator.ts   Velocity Verlet step
│  ├─ energy.ts       total kinetic + potential energy
│  ├─ momentum.ts     total linear momentum
│  ├─ presets.ts      starting conditions
│  ├─ units.ts        simulation time ↔ years
│  └─ timeWarp.ts     years-per-second → integrator steps
├─ render/      Canvas drawing: starfield, shaded bodies, trails
├─ components/  React UI: control dock and stats strip
└─ SimCanvas.tsx  the simulation loop that ties it together
```

The physics never imports anything from the rendering or UI code, so it can be tested on its own.

## Run it locally

```bash
npm install
npm run dev        # start the app at http://localhost:5173
npm test           # run the test suite once
```

## What I learned

- How a differential equation becomes an algorithm, and why the *choice* of algorithm changes the physics you get out.
- That models are built on deliberate assumptions — point masses, perfect spheres, tiny step errors — and part of engineering is knowing which ones are safe and checking them.
- That conserved quantities like energy and momentum let you test a simulation without knowing the exact answer.

## Built with

React · TypeScript · Vite · HTML5 Canvas · Vitest

---

Rhema · 2026
