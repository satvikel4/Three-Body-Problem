import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, Texture, Shape, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Material, Scene,
} = tiny;

export class Assignment3 extends Scene {
    constructor() {
        super();

        this.bodies = [
            { mass: 1e12, position: vec3(-10, 0, 0), velocity: vec3(0, 1, 0), trail: []},
            { mass: 1e12, position: vec3(10, 0, 0), velocity: vec3(0, -1, 0), trail: []}
        ]

        this.G = 6.67430e-11;
        this.time_step = 0.05;

        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
        };
        this.materials = {
            sphere: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, specularity: 0.3, color: hex_color("#ffffff")}),
        }

        this.colors = this.set_colors();
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    set_colors() {
        this.colors = [];
        for(let i = 0; i < this.bodies.length; i++) {
            let currentColor = color(Math.random(), Math.random(), Math.random(), 1.0);
            this.colors.push(currentColor)
        }
        return this.colors;
    }

    make_control_panel() {

        this.key_triggered_button("Change Colors", ["c"], this.set_colors)

        this.key_triggered_button("Increase Mass of Planet 1", ["m"], () => {
            this.bodies[0].mass *= 1.1;
        });

        this.key_triggered_button("Decrease Mass of Planet 1", ["n"], () => {
            this.bodies[0].mass /= 1.1;
        });

        this.key_triggered_button("Increase Mass of Planet 2", ["k"], () => {
            this.bodies[1].mass *= 1.1;
        });

        this.key_triggered_button("Decrease Mass of Planet 2", ["l"], () => {
            this.bodies[1].mass /= 1.1;
        });
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        this.update_positions();

        this.bodies.forEach((body, index) => {
            this.shapes.sphere.draw(
                context,
                program_state,
                Mat4.translation(...body.position).times(Mat4.scale(body.mass/1e12, body.mass/1e12, body.mass/1e12)),
                this.materials.sphere.override({color: this.colors[index]})
            );
        });
    }

    update_positions() {
        let force = this.calculate_gravitational_force(this.bodies[0], this.bodies[1]);

        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            let acceleration = force.times(1 / body.mass);
            if (i === 1) acceleration = acceleration.times(-1);
            body.velocity = body.velocity.plus(acceleration.times(this.time_step));
        }

        for (let body of this.bodies) {
            body.position = body.position.plus(body.velocity.times(this.time_step));
        }
    }

    calculate_gravitational_force(body1, body2) {
        let distance_vector = body2.position.minus(body1.position);
        let distance = distance_vector.norm();
        let force_magnitude = (this.G * body1.mass * body2.mass) / (distance ** 2);
        return distance_vector.normalized().times(force_magnitude);
    }
}