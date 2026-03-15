// js/graph.js
(async function(){
  const res = await fetch('/data/graph.json');
  if(!res.ok){ document.getElementById('graph').innerText = 'Graph not generated yet.'; return; }
  const graph = await res.json();
  const width = document.getElementById('graph').clientWidth || 1200;
  const height = 800;
  const svg = d3.select('#graph').append('svg').attr('width', '100%').attr('height', height);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const link = svg.append('g').attr('class','links').selectAll('line').data(graph.edges).enter().append('line').attr('stroke','#444').attr('stroke-width',1.2);
  const node = svg.append('g').attr('class','nodes').selectAll('g').data(graph.nodes).enter().append('g').call(d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended));

  node.append('circle').attr('r', d=>8 + (d.title.length>20?0:2)).attr('fill', (d,i)=>color(d.type));
  node.append('text').attr('x',12).attr('y',4).text(d=>d.title);

  node.on('click', d => window.location.href = '/' + d.path);

  const simulation = d3.forceSimulation(graph.nodes)
    .force('link', d3.forceLink(graph.edges).id((d,i)=>i).distance(80))
    .force('charge', d3.forceManyBody().strength(-120))
    .force('center', d3.forceCenter(width/2, height/2))
    .on('tick', ticked);

  function ticked(){
    link.attr('x1', d=>d.source.x)
        .attr('y1', d=>d.source.y)
        .attr('x2', d=>d.target.x)
        .attr('y2', d=>d.target.y);
    node.attr('transform', d=>`translate(${d.x},${d.y})`);
  }

  function dragstarted(event,d){ if(!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
  function dragged(event,d){ d.fx = event.x; d.fy = event.y; }
  function dragended(event,d){ if(!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

})();