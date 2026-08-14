import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { About } from "@/components/about";
import { Services } from "@/components/services";
import { Contact } from "@/components/contact";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div id="top">
      <SiteHeader />
      <main>
        <Hero />
        <Stats />
        <About />
        <Services />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
}
