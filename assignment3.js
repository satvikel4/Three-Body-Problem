import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, Texture, Shape, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Material, Scene,
} = tiny;

export class Assignment3 extends Scene {
    constructor() {
        super();

        this.bodies = [
            { mass: 1e11, position: vec3(-7, 0, 0), velocity: vec3(0, 1, 0), id: "b1", trail: [], colliding: false },
            { mass: 1e11, position: vec3(7, 0, 0), velocity: vec3(0, -1, 0), id: "b2", trail: [], colliding: false },
            { mass: 1e11, position: vec3(0, 5, 0), velocity: vec3(1, 0, 0), id: "b3", trail: [], colliding: false }
        ];

        this.G = 6.67430e-11;
        this.time_step = 0.1;
        this.paused = true;
        this.simulation_started = false;
        this.trailing = false;
        this.ongoing_collisions = new Set(); // New set to track ongoing collisions

        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
        };

        this.textures = {
            p1: new Texture("assets/earth.png"),
            p2: new Texture("assets/mars.png"),
            p3: new Texture("assets/jupiter.png")
        };

        this.materials = {
            p1: new Material(new defs.Textured_Phong(), {
                ambient: 1, diffusivity: 1, specularity: 0.3, texture: this.textures.p1
            }),
            p2: new Material(new defs.Textured_Phong(), {
                ambient: 1, diffusivity: 1, specularity: 0.3, texture: this.textures.p2
            }),
            p3: new Material(new defs.Textured_Phong(), {
                ambient: 1, diffusivity: 1, specularity: 0.3, texture: this.textures.p3
            })
        };

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.trail_material = new Material(new defs.Phong_Shader(), {
                ambient: 1, diffusivity: 0, specularity: 0, color: color(1, 1, 1, 1)
        });
    }

    toggle_trail_state() {
        this.trailing = !this.trailing;
    }

    draw_trails(context, program_state) {
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const trail_colors = [ color(0,0.615,0.769,1), color(0.906,0.490,0.067,1), color(0.675,0.506,0.506,1) ];
            
            for (let j = 0; j < body.trail.length; j++) {
                const position = body.trail[j];
                this.shapes.sphere.draw(
                    context,
                    program_state,
                    Mat4.translation(...position).times(Mat4.scale(0.1, 0.1, 0.1)), // Small spheres for trail
                    this.trail_material.override({ color: trail_colors[i] })
                );
            }
        }
    }

    make_control_panel() {
        this.key_triggered_button("Start Simulation", ["Enter"], () => {
            this.simulation_started = true;
            this.paused = false;
            this.disable_sliders();
        });
        this.new_line();
        this.new_line();
        this.key_triggered_button("Toggle Trail Display", ["t"], this.toggle_trail_state);

        this.new_line();
        this.new_line();
        this.control_panel.append("Earth X: ");
        this.earth_x_slider = this.create_slider(-12, 12, this.bodies[0].position[0], (x) => this.bodies[0].position[0] = x);
        this.control_panel.append(this.earth_x_slider);
        this.control_panel.append("Earth Y: ");
        this.earth_y_slider = this.create_slider(-12, 12, this.bodies[0].position[1], (y) => this.bodies[0].position[1] = y);
        this.control_panel.append(this.earth_y_slider);
        this.new_line();

        this.new_line();
        this.control_panel.append("Mars X: ");
        this.mars_x_slider = this.create_slider(-12, 12, this.bodies[1].position[0], (x) => this.bodies[1].position[0] = x);
        this.control_panel.append(this.mars_x_slider);
        this.control_panel.append("Mars Y: ");
        this.mars_y_slider = this.create_slider(-12, 12, this.bodies[1].position[1], (y) => this.bodies[1].position[1] = y);
        this.control_panel.append(this.mars_y_slider);
        this.new_line();

        this.new_line();
        this.control_panel.append("Jupiter X: ");
        this.jupiter_x_slider = this.create_slider(-12, 12, this.bodies[2].position[0], (x) => this.bodies[2].position[0] = x);
        this.control_panel.append(this.jupiter_x_slider);
        this.control_panel.append("Jupiter Y: ");
        this.jupiter_y_slider = this.create_slider(-12, 12, this.bodies[2].position[1], (y) => this.bodies[2].position[1] = y);
        this.control_panel.append(this.jupiter_y_slider);
        this.new_line();
        this.new_line();

        this.control_panel.append("Earth Mass: ");
        this.earth_mass_slider = this.create_slider(1e10, 1e12, this.bodies[0].mass, (m) => this.bodies[0].mass = m);
        this.control_panel.append(this.earth_mass_slider);
        this.new_line();

        this.control_panel.append("Mars Mass: ");
        this.mars_mass_slider = this.create_slider(1e10, 1e12, this.bodies[1].mass, (m) => this.bodies[1].mass = m);
        this.control_panel.append(this.mars_mass_slider);
        this.new_line();

        this.control_panel.append("Jupiter Mass: ");
        this.jupiter_mass_slider = this.create_slider(1e10, 1e12, this.bodies[2].mass, (m) => this.bodies[2].mass = m);
        this.control_panel.append(this.jupiter_mass_slider);
        this.new_line();
        this.new_line();

        this.key_triggered_button("Pause/Resume Simulation", [" "], () => {
            if (this.simulation_started) {
                this.paused = !this.paused;
            }
        });
        this.new_line();
        this.new_line();
        this.key_triggered_button("Reset Simulation", ["r"], () => {
            this.paused = true;
            this.simulation_started = false;
            this.bodies = [
                { mass: 1e11, position: vec3(-7, 0, 0), velocity: vec3(0, 1, 0), id: "b1", trail: [], colliding: false },
                { mass: 1e11, position: vec3(7, 0, 0), velocity: vec3(0, -1, 0), id: "b2", trail: [], colliding: false },
                { mass: 1e11, position: vec3(0, 5, 0), velocity: vec3(1, 0, 0), id: "b3", trail: [], colliding: false }
            ];
            this.ongoing_collisions.clear();
            this.enable_sliders();
        });
    }

    create_slider(min, max, initial, callback) {
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = min;
        slider.max = max;
        slider.value = initial;
        slider.step = 1;
        slider.oninput = (event) => callback(parseFloat(event.target.value));
        return slider;
    }

    enable_sliders() {
        this.earth_x_slider.disabled = false;
        this.earth_y_slider.disabled = false;
        this.mars_x_slider.disabled = false;
        this.mars_y_slider.disabled = false;
        this.jupiter_x_slider.disabled = false;
        this.jupiter_y_slider.disabled = false;
    }

    disable_sliders() {
        this.earth_x_slider.disabled = true;
        this.earth_y_slider.disabled = true;
        this.mars_x_slider.disabled = true;
        this.mars_y_slider.disabled = true;
        this.jupiter_x_slider.disabled = true;
        this.jupiter_y_slider.disabled = true;
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
        }

        // Calculate distances between bodies
        let distances = [];
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const distance = this.bodies[i].position.minus(this.bodies[j].position).norm();
                distances.push({ distance, pair: [i, j] });
            }
        }

        // Find the closest pair of bodies
        distances.sort((a, b) => a.distance - b.distance);
        const closestPair = distances[0].pair;
        const farthestDistance = distances[2].distance;

        // Calculate center of mass of the closest pair or all bodies
        let center_of_mass;
        if (farthestDistance > 80) {
            const body1 = this.bodies[closestPair[0]];
            const body2 = this.bodies[closestPair[1]];
            center_of_mass = body1.position.plus(body2.position).times(1 / 2);
        } else {
            center_of_mass = vec3(0, 0, 0);
            for (const body of this.bodies) {
                center_of_mass = center_of_mass.plus(body.position);
            }
            center_of_mass = center_of_mass.times(1 / this.bodies.length);
        }

        // Calculate the maximum distance of any body from the center of mass
        let max_distance = 0;
        for (const body of this.bodies) {
            const distance = body.position.minus(center_of_mass).norm();
            max_distance = Math.max(max_distance, distance);
        }

        // Adjust camera position and projection based on the maximum distance
        max_distance = Math.min(50, max_distance * 3);
        const distance_factor = Math.max(max_distance, 5); // Minimum distance for better viewing
        const camera_position = center_of_mass.plus(vec3(0, 10, 20).times(distance_factor / 20));
        program_state.set_camera(Mat4.look_at(camera_position, center_of_mass, vec3(0, 1, 0)));

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const light_positions = [
            vec4(this.bodies[0].position[0], this.bodies[0].position[1] + 10, this.bodies[0].position[2], 1),
            vec4(this.bodies[1].position[0], this.bodies[1].position[1] + 10, this.bodies[1].position[2], 1),
            vec4(this.bodies[2].position[0], this.bodies[2].position[1] + 10, this.bodies[2].position[2], 1)
        ];
        program_state.lights = light_positions.map(pos => new Light(pos, color(1, 1, 1, 1), 1000));

        if (!this.paused) {
            this.update_positions();
        }

        this.bodies.forEach((body, index) => {
            let planet;
            if (index == 0) planet = this.materials.p1;
            else if (index == 1) planet = this.materials.p2;
            else planet = this.materials.p3;
            this.shapes.sphere.draw(
                context,
                program_state,
                Mat4.translation(...body.position).times(Mat4.scale(1, 1, 1)),
                planet
            );
        });

        if (this.trailing) {
            this.draw_trails(context, program_state);
        }
    }

    // Check if two bodies are colliding using AABB
    are_bodies_colliding(body1, body2) {
        const half_size1 = body1.mass / 1e11;
        const half_size2 = body2.mass / 1e11;

        return (
            Math.abs(body1.position[0] - body2.position[0]) <= half_size1 + half_size2 &&
            Math.abs(body1.position[1] - body2.position[1]) <= half_size1 + half_size2 &&
            Math.abs(body1.position[2] - body2.position[2]) <= half_size1 + half_size2
        );
    }

    update_positions() {
        const forces = this.calculate_all_forces();

        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const acceleration = forces[i].times(1 / body.mass);
            body.velocity = body.velocity.plus(acceleration.times(this.time_step));
            body.trail.push(body.position.copy());

            const max_trail_length = 1000;
            if (body.trail.length > max_trail_length) {
                body.trail.shift();
            }
        }

        // Check for collisions and resolve them
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const pair_key = `${i}-${j}`;
                if (this.are_bodies_colliding(this.bodies[i], this.bodies[j])) {
                    if (!this.ongoing_collisions.has(pair_key)) {
                        this.bodies[i].colliding = true;
                        this.bodies[j].colliding = true;
                        this.paused = true;
                        this.ongoing_collisions.add(pair_key);
                        console.log("intersection");
                    }
                } else {
                    if (this.ongoing_collisions.has(pair_key)) {
                        this.ongoing_collisions.delete(pair_key);
                        this.bodies[i].colliding = false;
                        this.bodies[j].colliding = false;
                    }
                }
            }
        }

        for (let body of this.bodies) {
            body.position = body.position.plus(body.velocity.times(this.time_step));
        }
    }

    calculate_all_forces() {
        const forces = this.bodies.map(() => vec3(0, 0, 0));
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = 0; j < this.bodies.length; j++) {
                if (i != j) {
                    const force = this.calculate_gravitational_force(this.bodies[i], this.bodies[j]);
                    forces[i] = forces[i].plus(force);
                    forces[j] = forces[j].minus(force); // Newton's Third Law
                }
            }
        }

        return forces;
    }

    calculate_gravitational_force(body1, body2) {
        const distance_vector = body2.position.minus(body1.position);
        const distance = Math.max(distance_vector.norm(), 1);
        const force_magnitude = (this.G * body1.mass * body2.mass) / (distance ** 2);
        return distance_vector.normalized().times(force_magnitude);
    }
}
