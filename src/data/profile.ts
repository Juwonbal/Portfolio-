export interface ProfileData {
  bio: string[];
  certifications: string[];
  contacts: {
    email: string;
    linkedin: string;
    github: string;
    medium: string;
  };
}

export const PROFILE_DATA: ProfileData = {
  bio: [
    "I am a results-driven Cybersecurity Analyst with demonstrated expertise in network security, threat detection, and incident response.",
    "I have a proven ability to secure virtualized environments, conduct vulnerability assessments, and implement effective firewall configurations.",
    "Adept at leveraging Python for automation, I am committed to maintaining secure infrastructures and mitigating cyber threats.",
    "Beyond offensive security, I am an experienced Software Architect and Full-Stack Developer. I specialize in designing secure, scalable enterprise web applications and integrating AI ecosystems using modern stacks like React, Next.js, Node.js, and Supabase.",
    "Additionally, I hold a Bachelor's Degree in Mechanical Engineering from the University of Ilorin."
  ],
  certifications: [
    "Oracle Cloud Infrastructure Architect Associate (IZO-1072-25)",
    "Google Cybersecurity Professional Certificate",
    "Cisco Networking Academy Certificate: Cybersecurity Course",
    "ARC X Cyber threat Intelligence certificate",
    "ISC2 Certified in Cybersecurity"
  ],
  contacts: {
    email: "Juwonbal@gmail.com",
    linkedin: "https://www.linkedin.com/in/fawaz-balogun-5b37931ba",
    github: "https://github.com/Juwonbal",
    medium: "https://medium.com/@juwonbal"
  }
};
