// TODO use an enum for clickmode pref in both Options and content

let clickMode: string | null = null;
chrome.storage.sync.get(
  {
    clickCause: "Overlay Window"
  },
  items => {
    clickMode = items.clickCause;
  }
);

class MathElements {
  private matches: MathElement[];

  constructor() {
    this.matches = [...document.querySelectorAll("script[type^='math/tex']")]
      .map((e): [string | null, HTMLElement | null] => [
        e.textContent,
        e.parentElement
      ])
      .filter(e => e[0] != null && e[1] != null)
      .map(e => new MathElement(e[0]!, e[1]!));
    this.matches.forEach(math => {
      if (math.element.onclick === null) {
        math.element.onclick =
          clickMode === "New Tab" ? math.newTab : math.newOverlayWindow;
      }
    });
  }
}

class MathElement {
  public element: HTMLElement;
  private latex: string;
  private overLay: HTMLDivElement | null = null;

  constructor(latex: string, element: HTMLElement) {
    this.latex = latex;
    this.element = element;
  }

  public newTab = () => Wolfram.InNewTab(this.latex);

  public newOverlayWindow = (event: MouseEvent) => {
    this.removeOldOverlay();

    const div = document.createElement("div");
    div.id = "MathsOverlay";
    Style.div(div.style);
    Style.positionDiv(div.style, event);

    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", Wolfram.url(this.latex));
    Style.iframe(iframe.style);
    div.appendChild(iframe);

    const close = document.createElement("button");
    close.innerHTML = "&#10060;";
    Style.button(close.style);

    close.onclick = () => {
      this.removeOldOverlay();
    };

    div.appendChild(close);
    this.overLay = div;
    document.body.appendChild(div);
  };
  private removeOldOverlay = () => {
    if (this.overLay != null) this.overLay.remove();
  };
}

namespace Style {
  export let iframe = (ecss: CSSStyleDeclaration) => {
    resetStyle(ecss);
    ecss.height = "100%";
    ecss.width = "100%";
    ecss.resize = "both";
    ecss.border = "3px solid rgb(28,110,164)";
    ecss.borderRadius = "5px";
    ecss.boxShadow = "0px 8px 17px -3px rgba(0,0,0,0.54)";
    ecss.backgroundColor = "#fff";
    zeroSpacing(ecss);
  };

  export let div = (ecss: CSSStyleDeclaration) => {
    resetStyle(ecss);
    ecss.height = "200";
    ecss.width = "400";
    zeroSpacing(ecss);
  };
  export let positionDiv = (ecss: CSSStyleDeclaration, event: MouseEvent) => {
    ecss.position = "fixed";
    ecss.top = `${event.clientY - 5}px`;
    ecss.left = `${event.clientX - 5}px`;
  };

  export let button = (ecss: CSSStyleDeclaration) => {
    resetStyle(ecss);
    ecss.boxShadow = "0px 8px 17px -3px rgba(0,0,0,0.54)";
    ecss.position = "absolute";
    ecss.right = "5px";
    ecss.top = "5px";
  };

  const zeroSpacing = (ecss: CSSStyleDeclaration) => {
    ecss.margin = "0";
    ecss.padding = "0";
  };
  const resetStyle = (ecss: CSSStyleDeclaration) => {
    (ecss as any).all = "initial";
  };
}

let findMaths = () => new MathElements();
findMaths();
setInterval(findMaths, 2000);

namespace Wolfram {
  export const InNewTab = (query: string) => window.open(url(query));

  export const url = (query: string): string =>
    `https://www.wolframalpha.com/input/?i=${encodeURIComponent(query)}`;
}
