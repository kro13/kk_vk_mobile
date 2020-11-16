#ifdef GL_ES
precision mediump float;
#endif

attribute vec4 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aColor;
varying vec2 vTexCoord;
varying vec4 vColor;
uniform mat4 uMatrix;

void main(void) {
	vColor = vec4(aColor.bgr * aColor.a, aColor.a);
	vTexCoord = aTexCoord;
	gl_Position = uMatrix * aPosition;
}