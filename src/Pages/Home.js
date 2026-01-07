import '../App.css';
import Navbar from '../components/Navbar';
import Login from '../components/Login';
import Register from '../components/Register';
import Intro from '../components/Intro';
import Footer from '../components/Footer';
import AboutUs from '../components/AboutUs';

function Home() {
  return (
    <>
      <Intro />
      <Login />
      <Register />
      <AboutUs />
      <Footer />
      <Navbar />

    </>
  );
}

export default Home;
