import React, { useEffect, useState, Suspense } from 'react';
import axios from 'axios';



// Lazy load components
const Hero = React.lazy(() => import('@/components/HomePageSections/Hero'));
const Brands = React.lazy(() => import('@/components/HomePageSections/Brands'));


const HomePage = (headerData) => {
    const [brands, setBrands] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [homePageId, setHomePageId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/home/');
                if (response.data) {
                    setHomePageId(response.data.id); // Assuming the API returns an object with an 'id'
                }
                setData(response.data);
            } catch (error) {
                console.error("Error fetching data", error);
                setError("Failed to fetch data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

 

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div>
            <Suspense >
                <Hero hero={data?.hero} labelsDefault={data?.labels_default} headerData={headerData} />
            </Suspense>
            <Suspense >
                <Brands brands={data?.brands || []} textContent={{ brands_heading: data?.brands_heading || '' }} />
            </Suspense>

        </div>
    );
};

export default HomePage;
