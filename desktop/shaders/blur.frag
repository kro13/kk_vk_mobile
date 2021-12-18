#ifdef GL_ES
	precision mediump float;
#endif

varying vec2 vTexCoord;
uniform sampler2D uImage0;

const float offset1 = 0.0;
const float offset2 = 1.38;
const float offset3 = 3.23;

const float weight1 = 0.22;
const float weight2 = 0.31;
const float weight3 = 0.07;

void main()
{
	vec4 color = texture2D(uImage0, vTexCoord) * weight1;
	color += texture2D(uImage0, (vTexCoord + vec2(0.0, offset2))) * weight2;
	color += texture2D(uImage0, (vTexCoord - vec2(0.0, offset2))) * weight2;
	color += texture2D(uImage0, (vTexCoord + vec2(0.0, offset3))) * weight3;
	color += texture2D(uImage0, (vTexCoord - vec2(0.0, offset3))) * weight3;
	gl_FragColor = color;
}