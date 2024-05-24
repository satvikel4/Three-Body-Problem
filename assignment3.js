import {defs, tiny} from './examples/common.js';


const {
    Vector, Vector3, vec, Texture, Shape, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Material, Scene,
} = tiny;

export class Assignment3 extends Scene {
    constructor() {
        super();

        this.bodies = [
            { mass: 1e11, position: vec3(-7, 0, 0), velocity: vec3(0, 1, 0), id: "b1", trail: []},
            { mass: 1e11, position: vec3(7, 0, 0), velocity: vec3(0, -1, 0), id: "b2", trail: []},
            { mass: 1e11, position: vec3(0, 5, 0), velocity: vec3(1, 0, 0), id: "b3", trail: []}
        ]

        this.G = 6.67430e-11;
        this.time_step = 0.1;
        this.paused = false;

        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
        };
        this.materials = {
            sphere: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, specularity: 0.3, color: hex_color("#ffffff")}),
        }

        this.colors = this.set_colors();
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.trail_material = new Material(new defs.Phong_Shader(), {
            ambient: 1, diffusivity: 0, specularity: 0, color: color(1, 1, 1, 1)
        });
    }

    set_colors() {
        this.colors = [];
        for(let i = 0; i < this.bodies.length; i++) {
            let currentColor = color(Math.random(), Math.random(), Math.random(), 1.0);
            this.colors.push(currentColor)
        }
        return this.colors;
    }

    draw_trails(context, program_state) {
    
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const trail_color = this.colors[i];
            
            for (let j = 0; j < body.trail.length; j++) {
                const position = body.trail[j];
                this.shapes.sphere.draw(
                    context,
                    program_state,
                    Mat4.translation(...position).times(Mat4.scale(0.1, 0.1, 0.1)), // Small spheres for trail
                    this.trail_material.override({ color: trail_color })
                );
            }
        }
    }
    

    make_control_panel() {
        this.key_triggered_button("Change Colors", ["c"], this.set_colors)

        this.key_triggered_button("Increase Mass of Planet 1", ["m"], () => {
            this.bodies[0].mass *= 1.1;
        });

        this.key_triggered_button("Decrease Mass of Planet 1", ["n"], () => {
            this.bodies[0].mass /= 1.1;
        });

        this.key_triggered_button("Increase Mass of Planet 2", ["l"], () => {
            this.bodies[1].mass *= 1.1;
        });

        this.key_triggered_button("Decrease Mass of Planet 2", ["k"], () => {
            this.bodies[1].mass /= 1.1;
        });

        this.key_triggered_button("Increase Mass of Planet 3", ["p"], () => {
            this.bodies[2].mass *= 1.1;
        });

        this.key_triggered_button("Decrease Mass of Planet 3", ["o"], () => {
            this.bodies[2].mass /= 1.1;
        });

        this.key_triggered_button("Pause/Resume Simulation", [" "], () => {
            this.paused = !this.paused;
        });
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
                distances.push({distance, pair: [i, j]});
            }
        }

        // Find the closest pair of bodies
        distances.sort((a, b) => a.distance - b.distance);
        const closestPair = distances[0].pair;
        const farthestDistance = distances[2].distance;
        console.log(farthestDistance);

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

        if(!this.paused) {
            this.update_positions();
        }

        this.bodies.forEach((body, index) => {
            this.shapes.sphere.draw(
                context,
                program_state,
                Mat4.translation(...body.position).times(Mat4.scale(body.mass / 1e11, body.mass / 1e11, body.mass / 1e11)),
                this.materials.sphere.override({color: this.colors[index]})
            );
        });

        this.draw_trails(context, program_state);
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

