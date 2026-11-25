import { useSelector } from 'react-redux';
import { Link } from 'react-router';

const CARDS = [
  {
    title: 'Practice',
    text: 'Take a practice test in ELA, Math, Science or Social Studies.',
    to: '/practice',
    action: 'Start practice',
    icon: '/icons/practice.svg',
  },
  {
    title: 'My Results',
    text: 'See your scores and the answers of your past practice tests.',
    to: '/results',
    action: 'See my results',
    icon: '/icons/results.svg',
  },
  {
    title: 'My Supports',
    text: 'Choose the tools that help you, for example read aloud or extra time.',
    to: '/supports',
    action: 'Change my supports',
    icon: '/icons/supports.svg',
  },
];

export default function HomePage() {
  const user = useSelector((state) => state.auth.user);

  return (
    <>
      <h1 className="visually-hidden">Prairie Practice Home Page</h1>
      <div className="greeting">
        <span className="greeting-title">Welcome back, {user.firstName}</span>
        <span className="greeting-subtitle">What do you want to do today?</span>
      </div>
      <div className="home-cards">
        {CARDS.map((card) => (
          <section key={card.title} className="home-card card">
            <div className="card-body">
              <img src={card.icon} alt="" width="32" height="32" className="mb-2" />
              <h2 className="h4">{card.title}</h2>
              <p>{card.text}</p>
              <Link to={card.to} className="btn btn-primary">
                {card.action}
              </Link>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
