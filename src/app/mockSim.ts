export const samplePhysicsCode = `
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 600;
  canvas.height = 400;

  let waveIndex = 0;
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for(let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for(let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#10b981';
    
    for (let x = 0; x < canvas.width; x++) {
      const y = canvas.height / 2 + Math.sin(x * 0.02 + waveIndex) * 60 * Math.sin(waveIndex * 0.5);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('System: Quantum Wave Interference', 20, 30);
    ctx.fillText('Frequency Multiplier: ' + Math.sin(waveIndex * 0.5).toFixed(2) + 'x', 20, 50);

    waveIndex += 0.03;
    window.currentAnimationId = requestAnimationFrame(draw);
  }
  
  draw();
`;