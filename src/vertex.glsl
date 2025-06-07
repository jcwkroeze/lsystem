attribute vec4 position;

uniform mat4 projection;
uniform mat4 world;
uniform mat4 view;

void main(void)
{
    gl_Position = projection * view * world * position;
}

