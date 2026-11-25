/** A small heat-haze pass over the original four-viewport forest/sky texture. */
export function createNatureBackdrop(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) return undefined;
  const shader = (type: number, source: string) => {
    const result = gl.createShader(type)!;
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      gl.deleteShader(result);
      throw new Error("Backdrop shader unavailable");
    }
    return result;
  };
  const vertex = shader(
    gl.VERTEX_SHADER,
    `attribute vec2 position; varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`,
  );
  const fragment = shader(
    gl.FRAGMENT_SHADER,
    `precision mediump float;
    varying vec2 uv; uniform sampler2D image; uniform float progress,time,animated;
    uniform vec2 pointer; uniform float aspect;
    void main(){
      float zoom=1.+.4*min(progress*3.,1.);
      vec2 p=vec2(.5+(uv.x-.5)/zoom,.125+progress*.75+(1.-uv.y-.5)*.25/zoom);
      p+=pointer*vec2(.009,.003);
      float wave=sin(p.y*38.+time*.55)*cos(p.x*13.-time*.23);
      p.x+=animated*wave*.0018;
      p.y+=animated*sin(p.x*27.+time*.34)*.0006;
      vec3 color=texture2D(image,clamp(p,vec2(.002),vec2(.998))).rgb;
      float shade=smoothstep(.28,.92,uv.x)*.1;
      gl_FragColor=vec4(color*(1.-shade),1.);
    }`,
  );
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error("Backdrop unavailable");
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  let loaded = false,
    disposed = false;
  const image = new Image();
  image.onload = () => {
    if (disposed) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    loaded = true;
    canvas.dataset.ready = "true";
  };
  image.src = "/panda-reference/scene-bg.avif";
  const uniforms = Object.fromEntries(
    ["image", "progress", "time", "animated", "pointer", "aspect"].map((k) => [
      k,
      gl.getUniformLocation(program, k),
    ]),
  );
  return {
    draw(
      width: number,
      height: number,
      progress: number,
      time: number,
      x: number,
      y: number,
      animated: boolean,
    ) {
      if (!loaded || disposed) return;
      const dpr = Math.min(devicePixelRatio || 1, 1.25);
      const w = Math.round(width * dpr),
        h = Math.round(height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.image, 0);
      gl.uniform1f(uniforms.progress, progress);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.animated, animated ? 1 : 0);
      gl.uniform2f(uniforms.pointer, x, y);
      gl.uniform1f(uniforms.aspect, width / height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    dispose() {
      disposed = true;
      image.onload = null;
      image.src = "";
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    },
  };
}
