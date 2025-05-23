import Header from '../components/header';
import Hero from '../components/hero';
import Features from '../components/features';
import ContactSection from '../components/contact';
import ReviewsSlider from '../components/reviewSlider';
import PriceCalculator from '../components/priceCalculator';
import ShortFeatures from "../components/ShortFeatures";
import Footer from '../components/footer';

function Home() {
  return (
    <>
    <Header></Header>
    <Hero></Hero>
    <Features/>
    <ContactSection/>  
    <ReviewsSlider/>
    <PriceCalculator/>
    <ShortFeatures/>
    <Footer></Footer>
    </>
  );
}

export default Home;