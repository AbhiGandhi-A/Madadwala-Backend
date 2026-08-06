'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Edit, Plus, Search, Tag, Image as ImageIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTabs,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { offersApi, bannersApi } from '@/lib/api-client'

interface Offer {
  _id: string
  title: string
  description: string
  code: string
  discount: number
  expiryDate: string
}

interface Banner {
  _id: string
  title: string
  subtitle: string
  isActive: boolean
  image: string
}

export default function OffersAndBannersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([])
  const [filteredBanners, setFilteredBanners] = useState<Banner[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('offers')

  // Modals
  const [addOfferModalOpen, setAddOfferModalOpen] = useState(false)
  const [editOfferModalOpen, setEditOfferModalOpen] = useState(false)
  const [deleteOfferConfirmOpen, setDeleteOfferConfirmOpen] = useState(false)
  const [addBannerModalOpen, setAddBannerModalOpen] = useState(false)
  const [editBannerModalOpen, setEditBannerModalOpen] = useState(false)
  const [deleteBannerConfirmOpen, setDeleteBannerConfirmOpen] = useState(false)

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)

  const [offerFormData, setOfferFormData] = useState({ title: '', description: '', code: '', discount: 0, expiryDate: '' })
  const [bannerFormData, setBannerFormData] = useState({ title: '', subtitle: '', image: '', isActive: true })

  useEffect(() => {
    fetchOffersAndBanners()
  }, [])

  useEffect(() => {
    const filteredOffers = offers.filter((offer) =>
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOffers(filteredOffers)

    const filteredBanners = banners.filter((banner) =>
      banner.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredBanners(filteredBanners)
  }, [searchTerm, offers, banners])

  const fetchOffersAndBanners = async () => {
    try {
      const [offersData, bannersData] = await Promise.all([
        offersApi.getAll().catch(() => []),
        bannersApi.getAll().catch(() => []),
      ])
      setOffers(offersData || [])
      setBanners(bannersData || [])
    } catch (error) {
      console.error('[v0] Failed to fetch offers and banners:', error)
    }
  }

  // Offers handlers
  const handleAddOffer = () => {
    setOfferFormData({ title: '', description: '', code: '', discount: 0, expiryDate: '' })
    setAddOfferModalOpen(true)
  }

  const handleEditOffer = (offer: Offer) => {
    setSelectedOffer(offer)
    setOfferFormData(offer)
    setEditOfferModalOpen(true)
  }

  const handleDeleteOffer = (offer: Offer) => {
    setSelectedOffer(offer)
    setDeleteOfferConfirmOpen(true)
  }

  const confirmAddOffer = async () => {
    if (offerFormData.title && offerFormData.code) {
      try {
        await offersApi.create(offerFormData)
        await fetchOffersAndBanners()
        setAddOfferModalOpen(false)
      } catch (error) {
        console.error('[v0] Failed to add offer:', error)
      }
    }
  }

  const confirmEditOffer = async () => {
    if (selectedOffer && offerFormData.title) {
      try {
        await offersApi.update(selectedOffer._id, offerFormData)
        await fetchOffersAndBanners()
        setEditOfferModalOpen(false)
      } catch (error) {
        console.error('[v0] Failed to edit offer:', error)
      }
    }
  }

  const confirmDeleteOffer = async () => {
    if (selectedOffer) {
      try {
        await offersApi.delete(selectedOffer._id)
        await fetchOffersAndBanners()
        setDeleteOfferConfirmOpen(false)
      } catch (error) {
        console.error('[v0] Failed to delete offer:', error)
      }
    }
  }

  // Banners handlers
  const handleAddBanner = () => {
    setBannerFormData({ title: '', subtitle: '', image: '', isActive: true })
    setAddBannerModalOpen(true)
  }

  const handleEditBanner = (banner: Banner) => {
    setSelectedBanner(banner)
    setBannerFormData(banner)
    setEditBannerModalOpen(true)
  }

  const handleDeleteBanner = (banner: Banner) => {
    setSelectedBanner(banner)
    setDeleteBannerConfirmOpen(true)
  }

  const confirmAddBanner = async () => {
    if (bannerFormData.title && bannerFormData.image) {
      try {
        const formData = new FormData()
        formData.append('title', bannerFormData.title)
        formData.append('subtitle', bannerFormData.subtitle)
        formData.append('isActive', String(bannerFormData.isActive))
        await bannersApi.create(formData)
        await fetchOffersAndBanners()
        setAddBannerModalOpen(false)
      } catch (error) {
        console.error('[v0] Failed to add banner:', error)
      }
    }
  }

  const confirmEditBanner = async () => {
    if (selectedBanner && bannerFormData.title) {
      try {
        const formData = new FormData()
        formData.append('title', bannerFormData.title)
        formData.append('subtitle', bannerFormData.subtitle)
        formData.append('isActive', String(bannerFormData.isActive))
        await bannersApi.update(selectedBanner._id, formData)
        await fetchOffersAndBanners()
        setEditBannerModalOpen(false)
      } catch (error) {
        console.error('[v0] Failed to edit banner:', error)
      }
    }
  }

  const confirmDeleteBanner = async () => {
    if (selectedBanner) {
      try {
        await bannersApi.delete(selectedBanner._id)
        await fetchOffersAndBanners()
        setDeleteBannerConfirmOpen(false)
      } catch (error) {
        console.error('[v0] Failed to delete banner:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offers & Banners</h1>
          <p className="text-gray-600 mt-1">Manage promotional offers and banners</p>
        </div>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search offers or banners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <Tag size={18} />
            Offers
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <ImageIcon size={18} />
            Banners
          </TabsTrigger>
        </TabsList>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-6">
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddOffer}>
              <Plus size={20} />
              <span className="ml-2">Add Offer</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <Card key={offer._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{offer.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{offer.description}</p>
                  </div>
                  <div className="text-3xl font-bold text-green-600 ml-4">{offer.discount}%</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600">Discount Code</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{offer.code}</p>
                </div>

                <p className="text-xs text-gray-600 mb-4">Expires: {offer.expiryDate}</p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditOffer(offer)}
                  >
                    <Edit size={18} />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDeleteOffer(offer)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredOffers.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-500">No offers found</p>
            </Card>
          )}
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-6">
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddBanner}>
              <Plus size={20} />
              <span className="ml-2">Add Banner</span>
            </Button>
          </div>

          <div className="space-y-4">
            {filteredBanners.map((banner) => (
              <Card key={banner._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full md:w-48 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{banner.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            banner.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600">{banner.subtitle}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleEditBanner(banner)}
                      >
                        <Edit size={18} />
                        <span className="ml-2">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteBanner(banner)}
                      >
                        <Trash2 size={18} />
                        <span className="ml-2">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredBanners.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-500">No banners found</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Offer Modal */}
      <Dialog open={addOfferModalOpen} onOpenChange={setAddOfferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Title</Label>
              <Input
                placeholder="e.g., Summer Sale"
                value={offerFormData.title}
                onChange={(e) => setOfferFormData({ ...offerFormData, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Description</Label>
              <Input
                placeholder="e.g., Get 20% off"
                value={offerFormData.description}
                onChange={(e) => setOfferFormData({ ...offerFormData, description: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Discount Code</Label>
              <Input
                placeholder="e.g., SUMMER20"
                value={offerFormData.code}
                onChange={(e) => setOfferFormData({ ...offerFormData, code: e.target.value.toUpperCase() })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Discount %</Label>
              <Input
                type="number"
                placeholder="20"
                value={offerFormData.discount}
                onChange={(e) => setOfferFormData({ ...offerFormData, discount: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Expiry Date</Label>
              <Input
                type="date"
                value={offerFormData.expiryDate}
                onChange={(e) => setOfferFormData({ ...offerFormData, expiryDate: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOfferModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={confirmAddOffer}>
              Add Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Offer Modal */}
      <Dialog open={editOfferModalOpen} onOpenChange={setEditOfferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Title</Label>
              <Input
                value={offerFormData.title}
                onChange={(e) => setOfferFormData({ ...offerFormData, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Description</Label>
              <Input
                value={offerFormData.description}
                onChange={(e) => setOfferFormData({ ...offerFormData, description: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Discount Code</Label>
              <Input
                value={offerFormData.code}
                onChange={(e) => setOfferFormData({ ...offerFormData, code: e.target.value.toUpperCase() })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Discount %</Label>
              <Input
                type="number"
                value={offerFormData.discount}
                onChange={(e) => setOfferFormData({ ...offerFormData, discount: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Expiry Date</Label>
              <Input
                type="date"
                value={offerFormData.expiryDate}
                onChange={(e) => setOfferFormData({ ...offerFormData, expiryDate: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOfferModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={confirmEditOffer}>
              Update Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Offer Confirmation */}
      <Dialog open={deleteOfferConfirmOpen} onOpenChange={setDeleteOfferConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Offer</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete the offer &quot;{selectedOffer?.title}&quot;?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOfferConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeleteOffer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Banner Modal */}
      <Dialog open={addBannerModalOpen} onOpenChange={setAddBannerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Title</Label>
              <Input
                placeholder="Banner title"
                value={bannerFormData.title}
                onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Subtitle</Label>
              <Input
                placeholder="Banner subtitle"
                value={bannerFormData.subtitle}
                onChange={(e) => setBannerFormData({ ...bannerFormData, subtitle: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Image URL</Label>
              <Input
                placeholder="https://example.com/banner.jpg"
                value={bannerFormData.image}
                onChange={(e) => setBannerFormData({ ...bannerFormData, image: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={bannerFormData.isActive}
                onChange={(e) => setBannerFormData({ ...bannerFormData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="active" className="text-gray-700 cursor-pointer">
                Make this banner active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBannerModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={confirmAddBanner}>
              Add Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Banner Modal */}
      <Dialog open={editBannerModalOpen} onOpenChange={setEditBannerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Title</Label>
              <Input
                value={bannerFormData.title}
                onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Subtitle</Label>
              <Input
                value={bannerFormData.subtitle}
                onChange={(e) => setBannerFormData({ ...bannerFormData, subtitle: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700">Image URL</Label>
              <Input
                value={bannerFormData.image}
                onChange={(e) => setBannerFormData({ ...bannerFormData, image: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={bannerFormData.isActive}
                onChange={(e) => setBannerFormData({ ...bannerFormData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-active" className="text-gray-700 cursor-pointer">
                Make this banner active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBannerModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={confirmEditBanner}>
              Update Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Banner Confirmation */}
      <Dialog open={deleteBannerConfirmOpen} onOpenChange={setDeleteBannerConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete the banner &quot;{selectedBanner?.title}&quot;?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBannerConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeleteBanner}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
