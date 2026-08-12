/* Groups each role (h3 + its date line + bullets) into a .cv-subsection block.
   Shared by the live /cv page and the PDF pre-render in
   src/lib/generate-cv-pdf.mjs, so both paginate identically. */
function wrapCvSubsections(containerId) {
  var root = document.getElementById(containerId);
  if (!root) return;
  Array.prototype.forEach.call(root.querySelectorAll("h3"), function (heading) {
    if (heading.closest(".cv-subsection")) return;
    var wrapper = document.createElement("div");
    wrapper.classList.add("cv-subsection");
    heading.parentNode.insertBefore(wrapper, heading);
    wrapper.appendChild(heading);
    var next = wrapper.nextElementSibling;
    while (next && next.tagName !== "H2" && next.tagName !== "H3") {
      var toMove = next;
      next = toMove.nextElementSibling;
      wrapper.appendChild(toMove);
    }
  });
}
