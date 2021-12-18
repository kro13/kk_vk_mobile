#ifdef GL_ES
    precision mediump float;
#endif

varying vec2 vTexCoord;
uniform sampler2D uImage0;

void main(void)
{
    vec3 color = texture2D(uImage0, vTexCoord).rgb;
    float alpha = texture2D(uImage0, vTexCoord).a;
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}